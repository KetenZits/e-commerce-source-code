import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "@/server/trpc";
import { reviewSchema } from "@/server/schemas";
import { z } from "zod";

export const reviewRouter = router({
  forProduct: publicProcedure.input(z.object({ productId: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.review.findMany({
      where: { productId: input.productId, status: "PUBLISHED" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure.input(reviewSchema).mutation(async ({ ctx, input }) => {
    const purchased = await ctx.db.orderItem.findFirst({
      where: {
        order: { userId: ctx.user.id, status: { in: ["PAID", "PACKED", "SHIPPED", "DELIVERED"] } },
        variant: { productId: input.productId },
      },
    });
    try {
      return await ctx.db.review.create({
        data: {
          productId: input.productId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
          verifiedPurchase: Boolean(purchased),
          status: "PENDING",
        },
      });
    } catch {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You have already reviewed this product.",
      });
    }
  }),
});
