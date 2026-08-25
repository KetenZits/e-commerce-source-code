import { TRPCError } from "@trpc/server";
import { addMonths } from "date-fns";
import { z } from "zod";
import { filesToTree } from "@/lib/file-tree";
import { productFormSchema } from "@/server/schemas";
import { adminProcedure, router } from "@/server/trpc";
import { fulfillPaidOrder } from "@/server/services/license";
import { enqueue } from "@/server/queue";

export const adminRouter = router({
  revenue: adminProcedure.query(async ({ ctx }) => {
    const paid = await ctx.db.order.findMany({
      where: { status: "PAID" },
      include: { product: true },
      orderBy: { verifiedAt: "asc" },
    });
    const byDay = new Map<string, number>();
    const byProduct = new Map<string, { title: string; cents: number; count: number }>();
    for (const order of paid) {
      const day = (order.verifiedAt ?? order.createdAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + order.priceCents);
      const current = byProduct.get(order.productId) ?? { title: order.product.title, cents: 0, count: 0 };
      current.cents += order.priceCents;
      current.count += 1;
      byProduct.set(order.productId, current);
    }
    const totalCents = paid.reduce((sum, order) => sum + order.priceCents, 0);
    const pending = await ctx.db.order.count({ where: { status: "PENDING" } });
    return {
      totalCents,
      paidCount: paid.length,
      pendingCount: pending,
      series: [...byDay.entries()].map(([date, cents]) => ({ date, cents })),
      topProducts: [...byProduct.values()].sort((a, b) => b.cents - a.cents).slice(0, 6),
    };
  }),

  products: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({ orderBy: { updatedAt: "desc" } });
  }),

  productById: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.product.findUnique({ where: { id: input.id } });
  }),

  upsertProduct: adminProcedure.input(productFormSchema.extend({ id: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const { id, coverCode, coverLang, previewFiles, ...rest } = input;
    const data = {
      ...rest,
      demoUrl: rest.demoUrl || null,
      coverSnippet: { code: coverCode, lang: coverLang },
      repoPreviewFiles: filesToTree(previewFiles),
    };
    const product = id
      ? await ctx.db.product.update({ where: { id }, data })
      : await ctx.db.product.create({ data });
    await enqueue("index-product", { productId: product.id });
    return product;
  }),

  orders: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.order.findMany({
      include: { user: true, product: true, license: true },
      orderBy: [{ slipUncertain: "desc" }, { createdAt: "desc" }],
    });
  }),

  decidePayment: adminProcedure
    .input(z.object({ orderId: z.string(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This order is not pending." });
      }
      if (input.approve) {
        return fulfillPaidOrder(order.id);
      }
      return ctx.db.order.update({
        where: { id: order.id },
        data: { status: "FAILED", slipUncertain: false },
      });
    }),

  licenses: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.license.findMany({
      include: { user: true, product: true, downloadLogs: { take: 5, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  revokeLicense: adminProcedure.input(z.object({ licenseId: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.license.update({
      where: { id: input.licenseId },
      data: { revokedAt: new Date() },
    });
  }),

  extendLicense: adminProcedure.input(z.object({ licenseId: z.string() })).mutation(async ({ ctx, input }) => {
    const license = await ctx.db.license.findUnique({ where: { id: input.licenseId } });
    if (!license) throw new TRPCError({ code: "NOT_FOUND" });
    const from = license.expiresAt && license.expiresAt > new Date() ? license.expiresAt : new Date();
    return ctx.db.license.update({
      where: { id: license.id },
      data: { expiresAt: addMonths(from, 6), revokedAt: null },
    });
  }),
});
