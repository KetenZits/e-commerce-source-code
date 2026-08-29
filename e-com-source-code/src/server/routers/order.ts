import { randomBytes } from "node:crypto";
import { addMinutes } from "date-fns";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  checkoutSchema,
  customerCancellationSchema,
  orderIdSchema,
} from "@/server/schemas";
import { env } from "@/lib/env";
import { estimatedDeliveryLabel, matchShippingZone } from "@/lib/shipping";
import { asStringArray } from "@/lib/product";
import { publicProcedure, protectedProcedure, router } from "@/server/trpc";
import { getPaymentConfig } from "@/lib/payment-config";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { calculateTax, getTaxConfig } from "@/lib/commerce-config";
import { promptPayQr } from "@/server/services/payment";
import { decryptDigitalDelivery } from "@/server/services/digital-delivery";
import { enqueue } from "@/server/queue";
import { cartOwnerWhere, ensureCartSession } from "@/server/cart-session";
import { hashToken, newToken, slipFingerprint, writeAuditLog } from "@/server/services/audit";
import { reserveOrderStock } from "@/server/services/inventory";
import { cancelPendingOrder } from "@/server/services/fulfillment";
import { resolvePromotion } from "@/server/services/promotions";
import { invoicePayload } from "@/server/services/invoices";
import { z } from "zod";
import type { FulfillmentType, Prisma } from "@/generated/prisma/client";

function promptpayRef() {
  return `AT${randomBytes(5).toString("hex").toUpperCase()}`;
}

function orderFulfillment(types: FulfillmentType[]): FulfillmentType {
  const unique = new Set(types);
  if (unique.size === 1) return types[0] === "DIGITAL" ? "DIGITAL" : "PHYSICAL";
  return "MIXED";
}

async function assertOrderAccess(
  ctx: { db: typeof import("@/lib/db").db; session: { user?: { id: string } } | null },
  orderId: string,
  guestToken?: string,
) {
  const order = await ctx.db.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true, user: true },
  });
  if (!order) throw new TRPCError({ code: "NOT_FOUND" });
  const userId = ctx.session?.user?.id;
  const owns =
    (userId && order.userId === userId) ||
    (guestToken && order.guestAccessTokenHash === hashToken(guestToken));
  if (!owns) throw new TRPCError({ code: "NOT_FOUND" });
  return order;
}

export const orderRouter = router({
  quoteShipping: publicProcedure
    .input(
      z.object({
        addressId: z.string().optional(),
        province: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const storefront = await getStorefrontConfig();
      if (storefront.storeMode === "digital") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Shipping quotes are disabled in digital store mode.",
        });
      }
      let province = input.province;
      if (input.addressId && ctx.session?.user?.id) {
        const address = await ctx.db.address.findFirst({
          where: { id: input.addressId, userId: ctx.session.user.id },
        });
        if (!address) throw new TRPCError({ code: "NOT_FOUND" });
        province = address.province;
      }
      if (!province) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a shipping address." });

      const owner = await ensureCartSession(ctx);
      const cart = await ctx.db.cartItem.findMany({
        where: cartOwnerWhere(owner.userId, owner.sessionId),
        include: { variant: { include: { product: true } } },
      });
      const physical = cart.filter((item) => item.variant.product.fulfillmentType !== "DIGITAL");
      const weightGrams = physical.reduce(
        (sum, item) => sum + item.variant.weightGrams * item.quantity,
        0,
      );
      const zones = await ctx.db.shippingZone.findMany();
      const zone = matchShippingZone(zones, province, weightGrams);
      if (!zone) throw new TRPCError({ code: "BAD_REQUEST", message: "No shipping rate for this address." });
      return {
        zone: { ...zone, provinces: asStringArray(zone.provinces) },
        weightGrams,
        feeCents: zone.feeCents,
        estimatedDelivery: estimatedDeliveryLabel(province),
      };
    }),

  previewTotals: publicProcedure
    .input(z.object({ promotionCode: z.string().optional(), addressId: z.string().optional(), province: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const owner = await ensureCartSession(ctx);
      const cart = await ctx.db.cartItem.findMany({
        where: cartOwnerWhere(owner.userId, owner.sessionId),
        include: { variant: { include: { product: true } } },
      });
      const subtotalCents = cart.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0);
      const { discountCents } = input.promotionCode
        ? await resolvePromotion(input.promotionCode, subtotalCents).catch(() => ({ discountCents: 0, promotion: null }))
        : { discountCents: 0 };
      const taxConfig = await getTaxConfig();
      const taxed = calculateTax(Math.max(0, subtotalCents - discountCents), taxConfig);
      let shippingFeeCents = 0;
      const storefront = await getStorefrontConfig();
      const needsShipping =
        storefront.storeMode !== "digital" &&
        cart.some((item) => item.variant.product.fulfillmentType !== "DIGITAL");
      if (needsShipping && (input.addressId || input.province)) {
        try {
          const quote = await orderRouter.createCaller(ctx).quoteShipping({
            addressId: input.addressId,
            province: input.province,
          });
          shippingFeeCents = quote.feeCents;
        } catch {
          shippingFeeCents = 0;
        }
      }
      return {
        subtotalCents,
        discountCents,
        taxCents: taxed.taxCents,
        shippingFeeCents,
        totalCents: taxed.totalBeforeShippingCents + shippingFeeCents,
      };
    }),

  createFromCart: publicProcedure.input(checkoutSchema).mutation(async ({ ctx, input }) => {
    const storefront = await getStorefrontConfig();
    const owner = await ensureCartSession(ctx);
    const userId = ctx.session?.user?.id ?? null;
    const idempotencyKey = input.idempotencyKey || `ck_${nanoid(24)}`;

    const existing = await ctx.db.order.findUnique({ where: { idempotencyKey } });
    if (existing) return { ...existing, guestAccessToken: null as string | null };

    const cart = await ctx.db.cartItem.findMany({
      where: cartOwnerWhere(owner.userId, owner.sessionId),
      include: { variant: { include: { product: true } } },
    });
    if (cart.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });

    for (const item of cart) {
      if (item.variant.product.status !== "PUBLISHED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${item.variant.product.title} is no longer available.` });
      }
      const available = item.variant.stockQty - item.variant.reservedQty;
      if (available < item.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${item.variant.product.title} is out of stock for the selected option.`,
        });
      }
    }

    const types = cart.map((item) =>
      storefront.storeMode === "digital" ? ("DIGITAL" as const) : item.variant.product.fulfillmentType,
    );
    const fulfillmentType = orderFulfillment(types);
    const needsShipping = fulfillmentType !== "DIGITAL";

    if (!userId && !input.guest) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Add your email to continue as a guest." });
    }

    const address = input.addressId && userId
      ? await ctx.db.address.findFirst({ where: { id: input.addressId, userId } })
      : null;
    if (needsShipping && !address && !input.shippingAddress) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Choose a shipping address." });
    }

    const province = address?.province ?? input.shippingAddress?.province;
    const weightGrams = cart
      .filter((_, index) => types[index] !== "DIGITAL")
      .reduce((sum, item) => sum + item.variant.weightGrams * item.quantity, 0);
    const zone =
      needsShipping && input.shippingZoneId
        ? await ctx.db.shippingZone.findUnique({ where: { id: input.shippingZoneId } })
        : needsShipping && province
          ? matchShippingZone(await ctx.db.shippingZone.findMany(), province, weightGrams)
          : null;
    if (needsShipping && !zone) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a shipping method." });
    }
    if (needsShipping && province && zone) {
      const matched = matchShippingZone([zone], province, weightGrams);
      if (!matched) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That shipping method does not apply." });
      }
    }

    const subtotalCents = cart.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0);
    const { promotion, discountCents } = await resolvePromotion(input.promotionCode, subtotalCents);
    const taxConfig = await getTaxConfig();
    const taxed = calculateTax(Math.max(0, subtotalCents - discountCents), taxConfig);
    const shippingFeeCents = needsShipping ? (zone?.feeCents ?? 0) : 0;
    const totalCents = taxed.totalBeforeShippingCents + shippingFeeCents;
    const guestToken = userId ? null : newToken();

    const order = await ctx.db.$transaction(async (tx) => {
      let addressId = address?.id ?? null;
      if (!addressId && needsShipping && input.shippingAddress) {
        if (userId) {
          const createdAddress = await tx.address.create({
            data: {
              ...input.shippingAddress,
              addressLine2: input.shippingAddress.addressLine2 || null,
              userId,
            },
          });
          addressId = createdAddress.id;
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          addressId,
          fulfillmentType,
          subtotalCents,
          discountCents,
          taxCents: taxed.taxCents,
          taxRateBps: taxConfig.enabled ? taxConfig.rateBps : 0,
          billingDetails: (input.billingDetails ?? undefined) as Prisma.InputJsonValue | undefined,
          shippingFeeCents,
          totalCents,
          promotionCode: promotion?.code,
          guestEmail: input.guest?.email,
          guestName: input.guest?.name,
          guestPhone: input.guest?.phone,
          guestAccessTokenHash: guestToken ? hashToken(guestToken) : undefined,
          idempotencyKey,
          promptpayRef: promptpayRef(),
          expiresAt: addMinutes(new Date(), env.PAYMENT_TTL_MINUTES),
          shippingName: needsShipping ? zone?.name : "Digital delivery",
          estimatedDelivery: needsShipping && province
            ? estimatedDeliveryLabel(province)
            : "After payment confirmation",
          statusEvents: {
            create: {
              status: "PENDING",
              note: "Order created and awaiting PromptPay payment.",
            },
          },
          items: {
            create: cart.map((item, index) => ({
              productVariantId: item.variant.id,
              quantity: item.quantity,
              unitPriceCents: item.variant.priceCents,
              fulfillmentTypeSnapshot: types[index],
              productTitleSnapshot: item.variant.product.title,
              variantAttributesSnapshot: item.variant.attributes as object,
            })),
          },
          payments: {
            create: {
              provider: "promptpay",
              status: "PENDING",
              amountCents: totalCents,
            },
          },
        },
      });

      await reserveOrderStock(
        tx,
        cart.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
          title: item.variant.product.title,
        })),
        created.id,
        userId,
      );

      await tx.cartItem.deleteMany({ where: cartOwnerWhere(owner.userId, owner.sessionId) });
      return created;
    });

    await writeAuditLog({
      actorId: userId,
      action: "order.created",
      entityType: "Order",
      entityId: order.id,
      ipAddress: ctx.ip,
    });

    return { ...order, guestAccessToken: guestToken };
  }),

  byId: publicProcedure.input(orderIdSchema).query(async ({ ctx, input }) => {
    const order = await assertOrderAccess(ctx, input.orderId, input.guestToken);
    const payment = await getPaymentConfig();
    const qr = order.status === "PENDING" ? await promptPayQr(order.totalCents, payment.promptpayId) : null;
    const { digitalDeliveryEncrypted, guestAccessTokenHash, ...safeOrder } = order;
    void guestAccessTokenHash;
    const digitalDelivery =
      order.fulfillmentType !== "PHYSICAL" &&
      ["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) &&
      order.digitalDeliveredAt
        ? decryptDigitalDelivery(digitalDeliveryEncrypted)
        : null;
    return {
      ...safeOrder,
      digitalDelivery,
      qr,
      payment: {
        accountName: payment.accountName,
        promptpayId: payment.promptpayId,
        paymentMode: payment.paymentMode,
      },
    };
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
      where: { userId: ctx.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => {
      const { digitalDeliveryEncrypted, guestAccessTokenHash, ...safeOrder } = order;
      void digitalDeliveryEncrypted;
      void guestAccessTokenHash;
      return safeOrder;
    });
  }),

  markTransferred: publicProcedure
    .input(orderIdSchema.extend({ slipImageUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await assertOrderAccess(ctx, input.orderId, input.guestToken);
      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order is not waiting for payment." });
      }
      if (order.expiresAt < new Date()) {
        await cancelPendingOrder(order.id, "PromptPay payment window expired.");
        throw new TRPCError({ code: "BAD_REQUEST", message: "This payment window has expired." });
      }
      if (input.slipImageUrl) {
        const fingerprint = slipFingerprint(input.slipImageUrl);
        const duplicate = await ctx.db.paymentTransaction.findFirst({
          where: { slipFingerprint: fingerprint, orderId: { not: order.id } },
        });
        if (duplicate) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This slip was already used." });
        }
        await ctx.db.paymentTransaction.updateMany({
          where: { orderId: order.id, status: "PENDING" },
          data: { slipFingerprint: fingerprint },
        });
      }
      await ctx.db.order.update({
        where: { id: order.id },
        data: { slipImageUrl: input.slipImageUrl, slipUncertain: true },
      });
      await enqueue("verify-payment", { orderId: order.id });
      return { ok: true };
    }),

  cancelPending: publicProcedure
    .input(customerCancellationSchema.extend({ guestToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await assertOrderAccess(ctx, input.orderId, input.guestToken);
      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only unpaid orders can be cancelled." });
      }
      await cancelPendingOrder(order.id, input.reason, ctx.session?.user?.id);
      return { ok: true };
    }),

  invoice: publicProcedure.input(orderIdSchema).query(async ({ ctx, input }) => {
    const order = await assertOrderAccess(ctx, input.orderId, input.guestToken);
    if (!["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice is available after payment." });
    }
    const tax = await getTaxConfig();
    return invoicePayload(order, tax);
  }),
});
