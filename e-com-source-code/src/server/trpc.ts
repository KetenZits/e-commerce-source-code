import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "@/server/context";
import {
  canManageCatalog,
  canManageFinance,
  canManageOrders,
  isStaffRole,
} from "@/lib/roles";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  });
});

export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isStaffRole(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff only." });
  }
  return next({ ctx });
});

export const adminProcedure = staffProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." });
  }
  return next({ ctx });
});

export const catalogProcedure = staffProcedure.use(({ ctx, next }) => {
  if (!canManageCatalog(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Catalog access required." });
  }
  return next({ ctx });
});

export const orderStaffProcedure = staffProcedure.use(({ ctx, next }) => {
  if (!canManageOrders(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Order access required." });
  }
  return next({ ctx });
});

export const financeProcedure = staffProcedure.use(({ ctx, next }) => {
  if (!canManageFinance(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Finance access required." });
  }
  return next({ ctx });
});
