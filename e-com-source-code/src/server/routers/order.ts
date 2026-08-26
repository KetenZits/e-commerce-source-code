import { randomBytes } from "node:crypto";
import { addMinutes } from "date-fns";
import { TRPCError } from "@trpc/server";
import { checkoutSchema, orderIdSchema } from "@/server/schemas";
import { env } from "@/lib/env";
import { estimatedDeliveryLabel, matchShippingZone } from "@/lib/shipping";
import { asStringArray } from "@/lib/product";
import { protectedProcedure, router } from "@/server/trpc";
import { getPaymentConfig } from "@/lib/payment-config";
import { promptPayQr } from "@/server/services/payment";
import { enqueue } from "@/server/queue";
import { z } from "zod";

function promptpayRef() {
  return `AT${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const orderRouter = router({
  quoteShipping: protectedProcedure
    .input(z.object({ addressId: z.string() }))
    .query(async ({ ctx, input }) => {
      const address = await ctx.db.address.findFirst({
        where: { id: input.addressId, userId: ctx.user.id },
      });
      if (!address) throw new TRPCError({ code: "NOT_FOUND" });
      const cart = await ctx.db.cartItem.findMany({
        where: { userId: ctx.user.id },
        include: { variant: true },
      });
      const weightGrams = cart.reduce((sum, item) => sum + item.variant.weightGrams * item.quantity, 0);
      const zones = await ctx.db.shippingZone.findMany();
      const zone = matchShippingZone(zones, address.province, weightGrams);
      if (!zone) throw new TRPCError({ code: "BAD_REQUEST", message: "No shipping rate for this address." });
      return {
        zone: { ...zone, provinces: asStringArray(zone.provinces) },
        weightGrams,
        feeCents: zone.feeCents,
        estimatedDelivery: estimatedDeliveryLabel(address.province),
      };
    }),

  createFromCart: protectedProcedure.input(checkoutSchema).mutation(async ({ ctx, input }) => {
    const address = await ctx.db.address.findFirst({
      where: { id: input.addressId, userId: ctx.user.id },
    });
    if (!address) throw new TRPCError({ code: "NOT_FOUND", message: "Choose a shipping address." });

    const cart = await ctx.db.cartItem.findMany({
      where: { userId: ctx.user.id },
      include: { variant: { include: { product: true } } },
    });
    if (cart.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });

    for (const item of cart) {
      if (item.variant.product.status !== "PUBLISHED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${item.variant.product.title} is no longer available.` });
      }
      if (item.variant.stockQty < item.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${item.variant.product.title} is out of stock for the selected option.`,
        });
      }
    }

    const weightGrams = cart.reduce((sum, item) => sum + item.variant.weightGrams * item.quantity, 0);
    const zone = await ctx.db.shippingZone.findUnique({ where: { id: input.shippingZoneId } });
    if (!zone) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a shipping method." });
    const matched = matchShippingZone([zone], address.province, weightGrams);
    if (!matched) throw new TRPCError({ code: "BAD_REQUEST", message: "That shipping method does not apply." });

    const subtotalCents = cart.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0);
    const shippingFeeCents = zone.feeCents;
    const totalCents = subtotalCents + shippingFeeCents;

    const order = await ctx.db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: ctx.user.id,
          addressId: address.id,
          subtotalCents,
          shippingFeeCents,
          totalCents,
          promptpayRef: promptpayRef(),
          expiresAt: addMinutes(new Date(), env.PAYMENT_TTL_MINUTES),
          shippingName: zone.name,
          estimatedDelivery: estimatedDeliveryLabel(address.province),
          statusEvents: {
            create: {
              status: "PENDING",
              note: "Order created and awaiting PromptPay payment.",
            },
          },
          items: {
            create: cart.map((item) => ({
              productVariantId: item.variant.id,
              quantity: item.quantity,
              unitPriceCents: item.variant.priceCents,
              productTitleSnapshot: item.variant.product.title,
              variantAttributesSnapshot: item.variant.attributes as object,
            })),
          },
        },
      });
      await tx.cartItem.deleteMany({ where: { userId: ctx.user.id } });
      return created;
    });

    return order;
  }),

  byId: protectedProcedure.input(orderIdSchema).query(async ({ ctx, input }) => {
    const order = await ctx.db.order.findFirst({
      where: { id: input.orderId, userId: ctx.user.id },
      include: { items: true, address: true },
    });
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const payment = await getPaymentConfig();
    const qr = order.status === "PENDING" ? await promptPayQr(order.totalCents, payment.promptpayId) : null;
    return { ...order, qr, payment: { accountName: payment.accountName, promptpayId: payment.promptpayId, paymentMode: payment.paymentMode } };
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.order.findMany({
      where: { userId: ctx.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  markTransferred: protectedProcedure
    .input(orderIdSchema.extend({ slipImageUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: { id: input.orderId, userId: ctx.user.id, status: "PENDING" },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order is not waiting for payment." });
      if (order.expiresAt < new Date()) {
        await ctx.db.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            statusEvents: {
              create: {
                status: "CANCELLED",
                note: "PromptPay payment window expired.",
              },
            },
          },
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "This payment window has expired." });
      }
      await ctx.db.order.update({
        where: { id: order.id },
        data: { slipImageUrl: input.slipImageUrl, slipUncertain: true },
      });
      await enqueue("verify-payment", { orderId: order.id });
      return { ok: true };
    }),
});
