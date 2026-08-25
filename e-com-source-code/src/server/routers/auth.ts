import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "@/server/trpc";
import { registerSchema } from "@/server/schemas";

export const authRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const exists = await ctx.db.user.findUnique({ where: { email: input.email } });
    if (exists) {
      throw new TRPCError({ code: "CONFLICT", message: "An account with that email already exists." });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await ctx.db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: "BUYER",
      },
      select: { id: true, email: true, name: true },
    });
    return user;
  }),
});
