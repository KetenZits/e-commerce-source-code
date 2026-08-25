import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { productImages } from "@/lib/product";
import {
  fulfillSchema,
  productFormSchema,
  shippingZoneSchema,
  stockAdjustSchema,
} from "@/server/schemas";
import { adminProcedure, router } from "@/server/trpc";
import { fulfillPaidOrder, notifyShipped } from "@/server/services/fulfillment";
import { enqueue } from "@/server/queue";

export const adminRouter = router({
  revenue: adminProcedure.query(async ({ ctx }) => {
    const paid = await ctx.db.order.findMany({
      where: { status: { in: ["PAID", "PACKED", "SHIPPED", "DELIVERED"] } },
      include: { items: true },
      orderBy: { verifiedAt: "asc" },
    });
    const byDay = new Map<string, number>();
    const byProduct = new Map<string, { title: string; cents: number; count: number }>();
    for (const order of paid) {
      const day = (order.verifiedAt ?? order.createdAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + order.totalCents);
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
    return {
      totalCents: paid.reduce((sum, order) => sum + order.totalCents, 0),
      paidCount: paid.length,
      pendingCount: await ctx.db.order.count({ where: { status: "PENDING" } }),
      series: [...byDay.entries()].map(([date, cents]) => ({ date, cents })),
      topProducts: [...byProduct.values()].sort((a, b) => b.cents - a.cents).slice(0, 6),
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
    await enqueue("index-product", { productId: product.id });
    return product;
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
    return ctx.db.order.findMany({
      include: { user: true, items: true, address: true },
      orderBy: [{ slipUncertain: "desc" }, { createdAt: "desc" }],
    });
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
        data: { status: "CANCELLED", slipUncertain: false },
      });
    }),

  fulfill: adminProcedure.input(fulfillSchema).mutation(async ({ ctx, input }) => {
    const order = await ctx.db.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
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
      },
    });
    if (input.status === "SHIPPED") await notifyShipped(updated.id);
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
});
