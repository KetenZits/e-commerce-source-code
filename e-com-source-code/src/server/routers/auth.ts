import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "@/server/trpc";
import {
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  changePasswordSchema,
  setPasswordSchema,
} from "@/server/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { notify } from "@/server/services/notifications";
import {
  consumeAuthToken,
  issueAuthToken,
} from "@/server/services/tokens";
import { writeAuditLog } from "@/server/services/audit";

async function limitAuth(ip: string, action: string) {
  const result = await rateLimit({
    key: `auth:${action}:${ip}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!result.ok) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Try again shortly." });
  }
}

function appUrl(path: string) {
  return `${env.NEXTAUTH_URL.replace(/\/$/, "")}${path}`;
}

export const authRouter = router({
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    await limitAuth(ctx.ip, "register");
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
    const token = await issueAuthToken(user.id, "EMAIL_VERIFY", 60 * 24);
    await notify({
      event: "auth.verify-email",
      subject: "Confirm your Atelier account",
      text: `Confirm your email: ${appUrl(`/auth/verify?token=${token}`)}`,
      data: { email: user.email },
    });
    return user;
  }),

  verifyEmail: publicProcedure.input(verifyEmailSchema).mutation(async ({ ctx, input }) => {
    const record = await consumeAuthToken(input.token, "EMAIL_VERIFY");
    if (!record) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link is invalid or expired." });
    }
    await ctx.db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    });
    return { ok: true };
  }),

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetSchema)
    .mutation(async ({ ctx, input }) => {
      await limitAuth(ctx.ip, "reset");
      const user = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (user?.passwordHash) {
        const token = await issueAuthToken(user.id, "PASSWORD_RESET", 30);
        await notify({
          event: "auth.password-reset",
          subject: "Reset your Atelier password",
          text: `Reset your password: ${appUrl(`/auth/reset?token=${token}`)}`,
          data: { email: user.email },
        });
        await writeAuditLog({
          actorId: user.id,
          action: "auth.password-reset-requested",
          entityType: "User",
          entityId: user.id,
          ipAddress: ctx.ip,
        });
      }
      return { ok: true };
    }),

  resetPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ ctx, input }) => {
    await limitAuth(ctx.ip, "reset-confirm");
    const record = await consumeAuthToken(input.token, "PASSWORD_RESET");
    if (!record) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or expired." });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    await ctx.db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    return { ok: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        passwordHash: true,
      },
    });
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return { ...safe, hasPassword: Boolean(passwordHash) };
  }),

  updateProfile: protectedProcedure.input(updateProfileSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.db.user.update({
      where: { id: ctx.user.id },
      data: { name: input.name },
      select: { id: true, email: true, name: true },
    });
    await writeAuditLog({
      actorId: ctx.user.id,
      action: "auth.profile-updated",
      entityType: "User",
      entityId: ctx.user.id,
      ipAddress: ctx.ip,
    });
    return user;
  }),

  changePassword: protectedProcedure.input(changePasswordSchema).mutation(async ({ ctx, input }) => {
    await limitAuth(ctx.ip, "change-password");
    const user = await ctx.db.user.findUnique({ where: { id: ctx.user.id } });
    if (!user?.passwordHash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This account uses a social login. Set a password first.",
      });
    }
    const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    await ctx.db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "auth.password-changed",
      entityType: "User",
      entityId: user.id,
      ipAddress: ctx.ip,
    });
    return { ok: true };
  }),

  setPassword: protectedProcedure.input(setPasswordSchema).mutation(async ({ ctx, input }) => {
    await limitAuth(ctx.ip, "set-password");
    const user = await ctx.db.user.findUnique({ where: { id: ctx.user.id } });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    }
    if (user.passwordHash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A password is already set. Use change password instead.",
      });
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    await ctx.db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await writeAuditLog({
      actorId: user.id,
      action: "auth.password-set",
      entityType: "User",
      entityId: user.id,
      ipAddress: ctx.ip,
    });
    return { ok: true };
  }),

  resendVerification: protectedProcedure.mutation(async ({ ctx }) => {
    await limitAuth(ctx.ip, "verify-resend");
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
    }
    if (user.emailVerified) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Email is already verified." });
    }
    const token = await issueAuthToken(user.id, "EMAIL_VERIFY", 60 * 24);
    await notify({
      event: "auth.verify-email",
      subject: "Confirm your account",
      text: `Confirm your email: ${appUrl(`/auth/verify?token=${token}`)}`,
      data: { email: user.email },
    });
    return { ok: true };
  }),

  requestDataExport: protectedProcedure.mutation(async ({ ctx }) => {
    const [orders, addresses, reviews] = await Promise.all([
      ctx.db.order.findMany({ where: { userId: ctx.user.id }, include: { items: true } }),
      ctx.db.address.findMany({ where: { userId: ctx.user.id } }),
      ctx.db.review.findMany({ where: { userId: ctx.user.id } }),
    ]);
    await notify({
      event: "privacy.export",
      subject: "Your Atelier data export",
      text: "A copy of your account data is attached in this store log. Open Account to download from your order history and saved addresses.",
      data: { email: ctx.user.email },
    });
    return { orders, addresses, reviews };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const open = await ctx.db.order.count({
      where: { userId: ctx.user.id, status: { in: ["PENDING", "PAID", "PACKED", "SHIPPED"] } },
    });
    if (open > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Finish or cancel open orders before deleting the account.",
      });
    }
    await ctx.db.user.delete({ where: { id: ctx.user.id } });
    return { ok: true };
  }),
});
