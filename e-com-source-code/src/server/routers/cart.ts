import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cartItemSchema } from "@/server/schemas";
import { publicProcedure, router } from "@/server/trpc";
import { cartOwnerWhere, ensureCartSession } from "@/server/cart-session";
import { formatAttributes, productImages } from "@/lib/product";

async function mergeGuestCart(ctx: { db: typeof import("@/lib/db").db; session: { user?: { id: string } } | null; cartSessionId: string | null }) {
  const userId = ctx.session?.user?.id;
  if (!userId || !ctx.cartSessionId) return;
  const guestItems = await ctx.db.cartItem.findMany({ where: { sessionId: ctx.cartSessionId } });
  for (const item of guestItems) {
    const existing = await ctx.db.cartItem.findFirst({
      where: { userId, productVariantId: item.productVariantId },
    });
    if (existing) {
      await ctx.db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
      await ctx.db.cartItem.delete({ where: { id: item.id } });
    } else {
      await ctx.db.cartItem.update({
        where: { id: item.id },
        data: { userId, sessionId: null },
      });
    }
  }
}

async function loadCart(ctx: { db: typeof import("@/lib/db").db; userId: string | null; sessionId: string | null }) {
  const items = await ctx.db.cartItem.findMany({
    where: cartOwnerWhere(ctx.userId, ctx.sessionId),
    include: { variant: { include: { product: { include: { category: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const lines = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variantId: item.variant.id,
    sku: item.variant.sku,
    attributes: item.variant.attributes,
    attributeLabel: formatAttributes(item.variant.attributes),
    priceCents: item.variant.priceCents,
    stockQty: item.variant.stockQty,
    weightGrams: item.variant.weightGrams,
    product: {
      id: item.variant.product.id,
      slug: item.variant.product.slug,
      title: item.variant.product.title,
      brand: item.variant.product.brand,
      image: productImages(item.variant.product.images)[0] ?? item.variant.imageUrl,
    },
    lineTotalCents: item.quantity * item.variant.priceCents,
  }));
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const weightGrams = lines.reduce((sum, line) => sum + line.weightGrams * line.quantity, 0);
  return { lines, subtotalCents, weightGrams, count: lines.reduce((sum, line) => sum + line.quantity, 0) };
}

export const cartRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    await mergeGuestCart(ctx);
    const owner = await ensureCartSession(ctx);
    return loadCart({ db: ctx.db, userId: owner.userId, sessionId: owner.sessionId });
  }),

  add: publicProcedure.input(cartItemSchema).mutation(async ({ ctx, input }) => {
    const variant = await ctx.db.productVariant.findUnique({
      where: { id: input.productVariantId },
      include: { product: true },
    });
    if (!variant || variant.product.status !== "PUBLISHED") {
      throw new TRPCError({ code: "NOT_FOUND", message: "This item is not available." });
    }
    if (variant.stockQty < 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Out of stock." });
    }
    const owner = await ensureCartSession(ctx);
    const existing = await ctx.db.cartItem.findFirst({
      where: { ...cartOwnerWhere(owner.userId, owner.sessionId), productVariantId: variant.id },
    });
    const nextQty = (existing?.quantity ?? 0) + input.quantity;
    if (nextQty > variant.stockQty) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough stock for that quantity." });
    }
    if (existing) {
      await ctx.db.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } });
    } else {
      await ctx.db.cartItem.create({
        data: {
          userId: owner.userId,
          sessionId: owner.sessionId,
          productVariantId: variant.id,
          quantity: input.quantity,
        },
      });
    }
    return loadCart({ db: ctx.db, userId: owner.userId, sessionId: owner.sessionId });
  }),

  update: publicProcedure
    .input(z.object({ id: z.string(), quantity: z.number().int().min(0).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const owner = await ensureCartSession(ctx);
      const item = await ctx.db.cartItem.findFirst({
        where: { id: input.id, ...cartOwnerWhere(owner.userId, owner.sessionId) },
        include: { variant: true },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      if (input.quantity === 0) {
        await ctx.db.cartItem.delete({ where: { id: item.id } });
      } else {
        if (input.quantity > item.variant.stockQty) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough stock for that quantity." });
        }
        await ctx.db.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
      }
      return loadCart({ db: ctx.db, userId: owner.userId, sessionId: owner.sessionId });
    }),

  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const owner = await ensureCartSession(ctx);
    await ctx.db.cartItem.deleteMany({
      where: { id: input.id, ...cartOwnerWhere(owner.userId, owner.sessionId) },
    });
    return loadCart({ db: ctx.db, userId: owner.userId, sessionId: owner.sessionId });
  }),
});
