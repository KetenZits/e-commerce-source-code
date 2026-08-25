import { addressSchema } from "@/server/schemas";
import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";

export const addressRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.address.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ isDefault: "desc" }, { recipientName: "asc" }],
    });
  }),

  create: protectedProcedure.input(addressSchema).mutation(async ({ ctx, input }) => {
    if (input.isDefault) {
      await ctx.db.address.updateMany({ where: { userId: ctx.user.id }, data: { isDefault: false } });
    }
    const count = await ctx.db.address.count({ where: { userId: ctx.user.id } });
    return ctx.db.address.create({
      data: {
        ...input,
        addressLine2: input.addressLine2 || null,
        isDefault: input.isDefault ?? count === 0,
        userId: ctx.user.id,
      },
    });
  }),

  remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.address.deleteMany({ where: { id: input.id, userId: ctx.user.id } });
    return { ok: true };
  }),
});
