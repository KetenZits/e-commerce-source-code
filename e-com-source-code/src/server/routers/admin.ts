import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import { productImages } from "@/lib/product";
import { getPaymentConfig, savePaymentConfig } from "@/lib/payment-config";
import {
  getStorefrontConfig,
  saveStorefrontConfig,
} from "@/lib/storefront-config";
import {
  digitalDeliverySchema,
  fulfillSchema,
  paymentSettingsSchema,
  productFormSchema,
  shippingZoneSchema,
  stockAdjustSchema,
  storefrontSettingsSchema,
} from "@/server/schemas";
import { adminProcedure, router } from "@/server/trpc";
import { fulfillPaidOrder, notifyShipped } from "@/server/services/fulfillment";
import {
  decryptDigitalDelivery,
  encryptDigitalDelivery,
} from "@/server/services/digital-delivery";
import { notify } from "@/server/services/notifications";
import { enqueue } from "@/server/queue";
import { Prisma } from "@/generated/prisma/client";
import { startOfDay, startOfMonth, startOfWeek } from "date-fns";

export const adminRouter = router({
  revenue: adminProcedure.query(async ({ ctx }) => {
    const paid = await ctx.db.order.findMany({
      where: { status: { in: ["PAID", "PACKED", "SHIPPED", "DELIVERED"] } },
      include: { items: true },
      orderBy: { verifiedAt: "asc" },
    });
    const byDay = new Map<string, number>();
    const byWeek = new Map<string, number>();
    const byProduct = new Map<string, { title: string; cents: number; count: number }>();
    for (const order of paid) {
      const day = (order.verifiedAt ?? order.createdAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + order.totalCents);
      const week = startOfWeek(order.verifiedAt ?? order.createdAt, {
        weekStartsOn: 1,
      })
        .toISOString()
        .slice(0, 10);
      byWeek.set(week, (byWeek.get(week) ?? 0) + order.totalCents);
      for (const item of order.items) {
        const current = byProduct.get(item.productTitleSnapshot) ?? {
          title: item.productTitleSnapshot,
          cents: 0,
          count: 0,
        };
        current.cents += item.unitPriceCents * item.quantity;
        current.count += item.quantity;
        byProduct.set(item.productTitleSnapshot, current);
      }
    }
    const totalCents = paid.reduce((sum, order) => sum + order.totalCents, 0);
    const now = new Date();
    const [ordersToday, ordersThisMonth, pendingCount] = await Promise.all([
      ctx.db.order.count({ where: { createdAt: { gte: startOfDay(now) } } }),
      ctx.db.order.count({ where: { createdAt: { gte: startOfMonth(now) } } }),
      ctx.db.order.count({ where: { status: "PENDING" } }),
    ]);
    return {
      totalCents,
      paidCount: paid.length,
      pendingCount,
      ordersToday,
      ordersThisMonth,
      averageOrderCents: paid.length ? Math.round(totalCents / paid.length) : 0,
      dailySeries: [...byDay.entries()].map(([date, cents]) => ({ date, cents })),
      weeklySeries: [...byWeek.entries()].map(([date, cents]) => ({ date, cents })),
      topProducts: [...byProduct.values()]
        .sort((a, b) => b.count - a.count || b.cents - a.cents)
        .slice(0, 6),
    };
  }),

  products: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      include: { category: true, variants: true },
      orderBy: { updatedAt: "desc" },
    });
  }),

  productById: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUnique({
      where: { id: input.id },
      include: { category: true, variants: true },
    });
    if (!product) return null;
    return { ...product, images: productImages(product.images) };
  }),

  categories: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({ orderBy: { name: "asc" } });
  }),

  upsertProduct: adminProcedure.input(productFormSchema.extend({ id: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const { id, variants, ...rest } = input;
    const product = await ctx.db.$transaction(async (tx) => {
      const saved = id
        ? await tx.product.update({
            where: { id },
            data: { ...rest, images: rest.images },
          })
        : await tx.product.create({
            data: { ...rest, images: rest.images },
          });

      const keepIds = variants.map((variant) => variant.id).filter(Boolean) as string[];
      if (id) {
        await tx.productVariant.deleteMany({
          where: { productId: saved.id, id: { notIn: keepIds } },
        });
      }
      for (const variant of variants) {
        const data = {
          sku: variant.sku,
          attributes: variant.attributes,
          priceCents: variant.priceCents,
          stockQty: variant.stockQty,
          weightGrams: variant.weightGrams,
          imageUrl: variant.imageUrl || null,
        };
        if (variant.id) {
          await tx.productVariant.update({ where: { id: variant.id }, data });
        } else {
          await tx.productVariant.create({ data: { ...data, productId: saved.id } });
        }
      }
      return saved;
    });
    if (!id) {
      await ctx.db.productDraft.deleteMany({ where: { userId: ctx.user.id } });
    }
    await enqueue("index-product", { productId: product.id });
    return product;
  }),

  productDraft: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.productDraft.findUnique({ where: { userId: ctx.user.id } });
  }),

  saveProductDraft: adminProcedure
    .input(z.object({ data: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.productDraft.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          data: input.data as Prisma.InputJsonValue,
        },
        update: { data: input.data as Prisma.InputJsonValue },
      });
    }),

  clearProductDraft: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.db.productDraft.deleteMany({ where: { userId: ctx.user.id } });
    return { ok: true };
  }),

  inventory: adminProcedure.query(async ({ ctx }) => {
    const variants = await ctx.db.productVariant.findMany({
      include: { product: true },
      orderBy: { stockQty: "asc" },
    });
    return variants.map((variant) => ({
      ...variant,
      low: variant.stockQty <= env.LOW_STOCK_THRESHOLD,
    }));
  }),

  adjustStock: adminProcedure.input(stockAdjustSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.productVariant.update({
      where: { id: input.variantId },
      data: { stockQty: input.stockQty },
    });
  }),

  orders: adminProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
      include: { user: true, items: true, address: true },
      orderBy: [{ slipUncertain: "desc" }, { createdAt: "desc" }],
    });
    return orders.map((order) => {
      const { digitalDeliveryEncrypted, ...safeOrder } = order;
      void digitalDeliveryEncrypted;
      return safeOrder;
    });
  }),

  orderById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          items: true,
          address: true,
          statusEvents: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!order) return null;
      const { digitalDeliveryEncrypted, ...safeOrder } = order;
      return {
        ...safeOrder,
        digitalDelivery: decryptDigitalDelivery(digitalDeliveryEncrypted),
      };
    }),

  decidePayment: adminProcedure
    .input(z.object({ orderId: z.string(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This order is not pending payment." });
      }
      if (input.approve) return fulfillPaidOrder(order.id);
      return ctx.db.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          slipUncertain: false,
          statusEvents: {
            create: {
              status: "CANCELLED",
              note: "Payment rejected by an administrator.",
            },
          },
        },
      });
    }),

  fulfill: adminProcedure.input(fulfillSchema).mutation(async ({ ctx, input }) => {
    const order = await ctx.db.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.fulfillmentType === "DIGITAL") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Use digital delivery for this order.",
      });
    }
    const allowed: Record<string, string[]> = {
      PAID: ["PACKED", "CANCELLED"],
      PACKED: ["SHIPPED", "CANCELLED"],
      SHIPPED: ["DELIVERED"],
    };
    if (!allowed[order.status]?.includes(input.status)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot move ${order.status} to ${input.status}.` });
    }
    if (input.status === "SHIPPED" && !input.trackingNumber?.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Tracking number is required." });
    }
    const updated = await ctx.db.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        trackingNumber: input.trackingNumber || order.trackingNumber,
        shippingCarrier: input.shippingCarrier || order.shippingCarrier,
        statusEvents: {
          create: {
            status: input.status,
            note:
              input.status === "SHIPPED"
                ? `Shipped with ${input.shippingCarrier || order.shippingCarrier || "carrier"} · ${input.trackingNumber || order.trackingNumber || "tracking pending"}`
                : `Order marked ${input.status.toLowerCase()}.`,
          },
        },
      },
    });
    if (input.status === "SHIPPED") await notifyShipped(updated.id);
    return updated;
  }),

  deliverDigital: adminProcedure
    .input(digitalDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { user: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.fulfillmentType !== "DIGITAL") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This is not a digital order.",
        });
      }
      if (!["PAID", "DELIVERED"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment must be confirmed before digital delivery.",
        });
      }

      const deliveredAt = new Date();
      const updated = await ctx.db.order.update({
        where: { id: order.id },
        data: {
          status: "DELIVERED",
          digitalDeliveryEncrypted: encryptDigitalDelivery(input.content),
          digitalDeliveredAt: deliveredAt,
          statusEvents: {
            create: {
              status: "DELIVERED",
              note:
                order.status === "DELIVERED"
                  ? "Digital access details updated by an administrator."
                  : "Digital access details delivered to the customer.",
            },
          },
        },
      });
      await notify({
        event: "order.digital-delivered",
        subject: `Your digital order is ready · ${order.promptpayRef}`,
        text: `Sign in and open order ${order.promptpayRef} to view your digital access details.`,
        data: { email: order.user.email, orderId: order.id },
      });
      return updated;
    }),

  shippingZones: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  }),

  upsertShippingZone: adminProcedure.input(shippingZoneSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.db.shippingZone.update({ where: { id }, data });
    return ctx.db.shippingZone.create({ data });
  }),

  deleteShippingZone: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.shippingZone.delete({ where: { id: input.id } });
    return { ok: true };
  }),

  paymentSettings: adminProcedure.query(async () => getPaymentConfig()),

  savePaymentSettings: adminProcedure.input(paymentSettingsSchema).mutation(async ({ input }) => {
    return savePaymentConfig(input);
  }),

  storefrontSettings: adminProcedure.query(async () => getStorefrontConfig()),

  saveStorefrontSettings: adminProcedure
    .input(storefrontSettingsSchema)
    .mutation(async ({ input }) => {
      const saved = await saveStorefrontConfig(input);
      revalidatePath("/", "layout");
      return saved;
    }),
});
