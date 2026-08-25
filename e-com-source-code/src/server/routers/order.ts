import { randomBytes } from "node:crypto";
import { addMinutes } from "date-fns";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { checkoutSchema, orderIdSchema } from "@/server/schemas";
import { protectedProcedure, router } from "@/server/trpc";
import { promptPayQr } from "@/server/services/payment";
import { enqueue } from "@/server/queue";

function promptpayRef() {
  return `SC${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const orderRouter = router({
  create: protectedProcedure.input(checkoutSchema).mutation(async ({ ctx, input }) => {
    const product = await ctx.db.product.findFirst({
      where: { id: input.productId, status: "PUBLISHED" },
    });
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product is not available." });

    const existingLicense = await ctx.db.license.findFirst({
      where: { userId: ctx.user.id, productId: product.id, revokedAt: null },
    });
    if (existingLicense) {
      throw new TRPCError({ code: "CONFLICT", message: "You already own a license for this product." });
    }

    const pending = await ctx.db.order.findFirst({
      where: { userId: ctx.user.id, productId: product.id, status: "PENDING" },
    });
    if (pending) return pending;

    return ctx.db.order.create({
      data: {
        userId: ctx.user.id,
        productId: product.id,
        priceCents: product.priceCents,
        currency: product.currency,
        promptpayRef: promptpayRef(),
        expiresAt: addMinutes(new Date(), env.PAYMENT_TTL_MINUTES),
      },
    });
  }),

  byId: protectedProcedure.input(orderIdSchema).query(async ({ ctx, input }) => {
    const order = await ctx.db.order.findFirst({
      where: { id: input.orderId, userId: ctx.user.id },
      include: { product: true, license: true },
    });
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const qr = order.status === "PENDING" ? await promptPayQr(order.priceCents) : null;
    return { ...order, qr };
  }),

  markTransferred: protectedProcedure
    .input(orderIdSchema.extend({ slipImageUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: { id: input.orderId, userId: ctx.user.id, status: "PENDING" },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order is not waiting for payment." });
      if (order.expiresAt < new Date()) {
        await ctx.db.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
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
