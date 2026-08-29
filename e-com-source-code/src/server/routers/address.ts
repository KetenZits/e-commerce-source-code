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

  update: protectedProcedure
    .input(addressSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.address.findFirst({
        where: { id, userId: ctx.user.id },
      });
      if (!existing) return null;
      if (data.isDefault) {
        await ctx.db.address.updateMany({ where: { userId: ctx.user.id }, data: { isDefault: false } });
      }
      return ctx.db.address.update({
        where: { id },
        data: {
          ...data,
          addressLine2: data.addressLine2 || null,
        },
      });
    }),

  remove: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.db.address.deleteMany({ where: { id: input.id, userId: ctx.user.id } });
    return { ok: true };
  }),
});
