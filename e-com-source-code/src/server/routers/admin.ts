import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { productImages } from "@/lib/product";
import { getPaymentConfig, savePaymentConfig } from "@/lib/payment-config";
import {
  getStorefrontConfig,
  saveStorefrontConfig,
} from "@/lib/storefront-config";
import { getReviewConfig, saveReviewConfig } from "@/lib/review-config";
import { getTaxConfig, saveTaxConfig } from "@/lib/commerce-config";
import {
  categorySchema,
  digitalCodeImportSchema,
  digitalDeliverySchema,
  fulfillSchema,
  paymentSettingsSchema,
  productFormSchema,
  promotionSchema,
  refundSchema,
  reviewModerationSchema,
  reviewSettingsSchema,
  shippingZoneSchema,
  stockAdjustSchema,
  storefrontSettingsSchema,
  taxSettingsSchema,
} from "@/server/schemas";
import {
  adminProcedure,
  catalogProcedure,
  financeProcedure,
  orderStaffProcedure,
  staffProcedure,
  router,
} from "@/server/trpc";
import {
  completeRefund,
  fulfillPaidOrder,
  notifyShipped,
} from "@/server/services/fulfillment";
import {
  decryptDigitalDelivery,
  encryptDigitalDelivery,
} from "@/server/services/digital-delivery";
import { importDigitalCodes } from "@/server/services/digital-codes";
import { isLowStock, setStockAbsolute } from "@/server/services/inventory";
import { notifyStockAlerts } from "@/server/services/stock-alerts";
import { listStockAlerts } from "@/server/services/stock-alert-store";
import { notify, retryFailedNotifications } from "@/server/services/notifications";
import { enqueue } from "@/server/queue";
import { writeAuditLog } from "@/server/services/audit";
import { Prisma } from "@/generated/prisma/client";
import { startOfDay, startOfMonth, startOfWeek } from "date-fns";

export const adminRouter = router({
  revenue: staffProcedure.query(async ({ ctx }) => {
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

  products: catalogProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      include: { category: true, variants: true },
      orderBy: { updatedAt: "desc" },
    });
  }),

  productById: catalogProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUnique({
      where: { id: input.id },
      include: { category: true, variants: { include: { digitalCodes: { select: { id: true, status: true } } } } },
    });
    if (!product) return null;
    return { ...product, images: productImages(product.images) };
  }),

  categories: catalogProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  }),

  upsertCategory: catalogProcedure.input(categorySchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    const saved = id
      ? await ctx.db.category.update({ where: { id }, data })
      : await ctx.db.category.create({ data });
    await writeAuditLog({
      actorId: ctx.user.id,
      action: id ? "category.updated" : "category.created",
      entityType: "Category",
      entityId: saved.id,
      ipAddress: ctx.ip,
    });
    revalidatePath("/categories");
    return saved;
  }),

  deleteCategory: catalogProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const used = await ctx.db.product.count({ where: { categoryId: input.id } });
    if (used > 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Move products out of this collection first." });
    }
    await ctx.db.category.delete({ where: { id: input.id } });
    return { ok: true };
  }),

  upsertProduct: catalogProcedure.input(productFormSchema.extend({ id: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const { id, variants, ...rest } = input;
    const previous = id
      ? await ctx.db.product.findUnique({
          where: { id },
          include: { variants: { select: { priceCents: true } } },
        })
      : null;
    const oldBase = previous?.basePriceCents;
    const incomingPrices = variants.map((variant) => variant.priceCents);
    const allIncomingSame = incomingPrices.length > 0 && incomingPrices.every((price) => price === incomingPrices[0]);
    const shouldSyncVariantsToBase =
      Boolean(id) &&
      oldBase != null &&
      rest.basePriceCents !== oldBase &&
      allIncomingSame &&
      incomingPrices[0] === oldBase;
    const product = await ctx.db.$transaction(async (tx) => {
      const saved = id
        ? await tx.product.update({
            where: { id },
            data: { ...rest, images: rest.images, imageAltTexts: rest.imageAltTexts ?? [] },
          })
        : await tx.product.create({
            data: { ...rest, images: rest.images, imageAltTexts: rest.imageAltTexts ?? [] },
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
          priceCents: shouldSyncVariantsToBase ? rest.basePriceCents : variant.priceCents,
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
    await writeAuditLog({
      actorId: ctx.user.id,
      action: id ? "product.updated" : "product.created",
      entityType: "Product",
      entityId: product.id,
      ipAddress: ctx.ip,
    });
    return product;
  }),

  productDraft: catalogProcedure.query(async ({ ctx }) => {
    return ctx.db.productDraft.findUnique({ where: { userId: ctx.user.id } });
  }),

  saveProductDraft: catalogProcedure
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

  clearProductDraft: catalogProcedure.mutation(async ({ ctx }) => {
    await ctx.db.productDraft.deleteMany({ where: { userId: ctx.user.id } });
    return { ok: true };
  }),

  inventory: catalogProcedure.query(async ({ ctx }) => {
    const variants = await ctx.db.productVariant.findMany({
      include: {
        product: {
          select: {
            id: true,
            title: true,
            brand: true,
            images: true,
            fulfillmentType: true,
          },
        },
      },
      orderBy: { stockQty: "asc" },
    });
    return variants.map((variant) => ({
      ...variant,
      availableQty: Math.max(0, variant.stockQty - variant.reservedQty),
      low: isLowStock(variant.stockQty, variant.reservedQty),
    }));
  }),

  inventoryMovements: catalogProcedure
    .input(z.object({ variantId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.inventoryMovement.findMany({
        where: input?.variantId ? { variantId: input.variantId } : undefined,
        include: {
          variant: {
            select: {
              sku: true,
              imageUrl: true,
              product: { select: { title: true, images: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }),

  adjustStock: catalogProcedure.input(stockAdjustSchema).mutation(async ({ ctx, input }) => {
    const previous = await ctx.db.productVariant.findUnique({ where: { id: input.variantId } });
    const result = await ctx.db.$transaction((tx) =>
      setStockAbsolute(tx, input.variantId, input.stockQty, input.reason ?? "Manual adjustment", ctx.user.id),
    );
    const wasUnavailable = previous
      ? previous.stockQty - previous.reservedQty <= 0
      : false;
    const nowAvailable = result.stockQty - (previous?.reservedQty ?? 0) > 0;
    if (wasUnavailable && nowAvailable) {
      await notifyStockAlerts(input.variantId);
    }
    return result;
  }),

  importDigitalCodes: catalogProcedure.input(digitalCodeImportSchema).mutation(async ({ ctx, input }) => {
    const count = await ctx.db.$transaction((tx) => importDigitalCodes(tx, input.variantId, input.codes));
    await writeAuditLog({
      actorId: ctx.user.id,
      action: "digital-codes.imported",
      entityType: "ProductVariant",
      entityId: input.variantId,
      metadata: { count },
      ipAddress: ctx.ip,
    });
    return { count };
  }),

  orders: orderStaffProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
      include: { user: true, items: true, address: true },
      orderBy: [{ slipUncertain: "desc" }, { createdAt: "desc" }],
    });
    return orders.map((order) => {
      const { digitalDeliveryEncrypted, guestAccessTokenHash, ...safeOrder } = order;
      void digitalDeliveryEncrypted;
      void guestAccessTokenHash;
      return safeOrder;
    });
  }),

  orderById: orderStaffProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          items: true,
          address: true,
          statusEvents: { orderBy: { createdAt: "asc" } },
          payments: true,
          refunds: true,
        },
      });
      if (!order) return null;
      const { digitalDeliveryEncrypted, guestAccessTokenHash, ...safeOrder } = order;
      void guestAccessTokenHash;
      return {
        ...safeOrder,
        digitalDelivery: decryptDigitalDelivery(digitalDeliveryEncrypted),
      };
    }),

  decidePayment: orderStaffProcedure
    .input(z.object({ orderId: z.string(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This order is not pending payment." });
      }
      if (input.approve) return fulfillPaidOrder(order.id, ctx.user.id);
      const { cancelPendingOrder } = await import("@/server/services/fulfillment");
      return cancelPendingOrder(order.id, "Payment rejected by an administrator.", ctx.user.id);
    }),

  fulfill: orderStaffProcedure.input(fulfillSchema).mutation(async ({ ctx, input }) => {
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

  deliverDigital: orderStaffProcedure
    .input(digitalDeliverySchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { user: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.fulfillmentType === "PHYSICAL") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This is not a digital order.",
        });
      }
      if (!["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment must be confirmed before digital delivery.",
        });
      }

      const deliveredAt = new Date();
      const nextStatus = order.fulfillmentType === "DIGITAL" ? "DELIVERED" : order.status;
      const updated = await ctx.db.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          digitalDeliveryEncrypted: encryptDigitalDelivery(input.content),
          digitalDeliveredAt: deliveredAt,
          ...(nextStatus === "DELIVERED"
            ? {
                statusEvents: {
                  create: {
                    status: "DELIVERED" as const,
                    note:
                      order.status === "DELIVERED"
                        ? "Digital access details updated by an administrator."
                        : "Digital access details delivered to the customer.",
                  },
                },
              }
            : {}),
        },
      });
      const email = order.user?.email ?? order.guestEmail;
      await notify({
        event: "order.digital-delivered",
        subject: `Your digital order is ready · ${order.promptpayRef}`,
        text: `Open order ${order.promptpayRef} to view your digital access details.`,
        data: { email, orderId: order.id },
      });
      return updated;
    }),

  refund: financeProcedure.input(refundSchema).mutation(async ({ ctx, input }) => {
    try {
      return await completeRefund({ ...input, actorId: ctx.user.id });
    } catch (error) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error instanceof Error ? error.message : "Refund failed.",
      });
    }
  }),

  shippingZones: orderStaffProcedure.query(async ({ ctx }) => {
    return ctx.db.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  }),

  upsertShippingZone: orderStaffProcedure.input(shippingZoneSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.db.shippingZone.update({ where: { id }, data });
    return ctx.db.shippingZone.create({ data });
  }),

  deleteShippingZone: orderStaffProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.shippingZone.delete({ where: { id: input.id } });
    return { ok: true };
  }),

  paymentSettings: financeProcedure.query(async () => getPaymentConfig()),

  savePaymentSettings: financeProcedure.input(paymentSettingsSchema).mutation(async ({ ctx, input }) => {
    const saved = await savePaymentConfig(input);
    await writeAuditLog({
      actorId: ctx.user.id,
      action: "settings.payment",
      entityType: "StoreSetting",
      ipAddress: ctx.ip,
    });
    return saved;
  }),

  taxSettings: financeProcedure.query(async () => getTaxConfig()),

  saveTaxSettings: financeProcedure.input(taxSettingsSchema).mutation(async ({ ctx, input }) => {
    const saved = await saveTaxConfig(input);
    await writeAuditLog({
      actorId: ctx.user.id,
      action: "settings.tax",
      entityType: "StoreSetting",
      ipAddress: ctx.ip,
    });
    return saved;
  }),

  promotions: financeProcedure.query(async ({ ctx }) => {
    return ctx.db.promotion.findMany({ orderBy: { createdAt: "desc" } });
  }),

  upsertPromotion: financeProcedure.input(promotionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    if (id) return ctx.db.promotion.update({ where: { id }, data });
    return ctx.db.promotion.create({ data });
  }),

  storefrontSettings: adminProcedure.query(async () => getStorefrontConfig()),

  saveStorefrontSettings: adminProcedure
    .input(storefrontSettingsSchema)
    .mutation(async ({ input }) => {
      const saved = await saveStorefrontConfig(input);
      revalidatePath("/", "layout");
      return saved;
    }),

  reviews: catalogProcedure.query(async ({ ctx }) => {
    return ctx.db.review.findMany({
      include: { product: true, user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  reviewSettings: catalogProcedure.query(async () => getReviewConfig()),

  saveReviewSettings: catalogProcedure.input(reviewSettingsSchema).mutation(async ({ input }) => {
    return saveReviewConfig(input);
  }),

  moderateReview: catalogProcedure.input(reviewModerationSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.review.update({
      where: { id: input.reviewId },
      data: { status: input.status, adminNote: input.adminNote },
    });
  }),

  notifications: staffProcedure.query(async ({ ctx }) => {
    return ctx.db.notificationLog.findMany({
      orderBy: { id: "desc" },
      take: 100,
    });
  }),

  retryNotifications: staffProcedure.mutation(async () => {
    const count = await retryFailedNotifications();
    return { count };
  }),

  auditLogs: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.auditLog.findMany({
      include: { actor: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }),

  staff: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { role: { not: "BUYER" } },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  setStaffRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["BUYER", "ADMIN", "CATALOG_MANAGER", "ORDER_MANAGER", "FINANCE"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id && input.role !== "ADMIN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own admin role." });
      }
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      });
    }),

  exportProducts: catalogProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    });
    return products.flatMap((product) =>
      product.variants.map((variant) => ({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        brand: product.brand,
        category: product.category.name,
        status: product.status,
        fulfillment: product.fulfillmentType,
        sku: variant.sku,
        priceCents: variant.priceCents,
        stockQty: variant.stockQty,
        reservedQty: variant.reservedQty,
      })),
    );
  }),

  exportOrders: orderStaffProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.order.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      email: order.guestEmail ?? order.user?.email ?? "",
      totalCents: order.totalCents,
      taxCents: order.taxCents,
      discountCents: order.discountCents,
      promotionCode: order.promotionCode ?? "",
      createdAt: order.createdAt.toISOString(),
    }));
  }),

  stockAlerts: catalogProcedure.query(async ({ ctx }) => {
    return listStockAlerts(ctx.db);
  }),
});
