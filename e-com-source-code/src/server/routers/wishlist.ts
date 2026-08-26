import { z } from "zod";
import { protectedProcedure, router } from "@/server/trpc";

const productIdSchema = z.object({ productId: z.string().min(1) });

export const wishlistRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.wishlistItem.findMany({
      where: { userId: ctx.user.id },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });
    return items.map((item) => item.productId);
  }),

  toggle: protectedProcedure
    .input(productIdSchema.extend({ liked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.liked) {
        const product = await ctx.db.product.findFirst({
          where: { id: input.productId, status: "PUBLISHED" },
          select: { id: true },
        });
        if (product) {
          await ctx.db.wishlistItem.upsert({
            where: {
              userId_productId: {
                userId: ctx.user.id,
                productId: input.productId,
              },
            },
            create: { userId: ctx.user.id, productId: input.productId },
            update: {},
          });
        }
      } else {
        await ctx.db.wishlistItem.deleteMany({
          where: { userId: ctx.user.id, productId: input.productId },
        });
      }
      return { productId: input.productId, liked: input.liked };
    }),

  sync: protectedProcedure
    .input(z.object({ productIds: z.array(z.string()).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: { id: { in: [...new Set(input.productIds)] }, status: "PUBLISHED" },
        select: { id: true },
      });
      if (products.length) {
        await ctx.db.wishlistItem.createMany({
          data: products.map((product) => ({
            userId: ctx.user.id,
            productId: product.id,
          })),
          skipDuplicates: true,
        });
      }
      const items = await ctx.db.wishlistItem.findMany({
        where: { userId: ctx.user.id },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
      });
      return items.map((item) => item.productId);
    }),
});
