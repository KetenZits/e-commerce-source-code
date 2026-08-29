import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import type { Context } from "@/server/context";
import { isProduction } from "@/lib/env";

export async function ensureCartSession(ctx: Context) {
  if (ctx.session?.user?.id) return { userId: ctx.session.user.id, sessionId: null as string | null };
  if (ctx.cartSessionId) return { userId: null, sessionId: ctx.cartSessionId };
  const sessionId = nanoid();
  const jar = await cookies();
  jar.set("cart_sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { userId: null, sessionId };
}

export function cartOwnerWhere(userId: string | null, sessionId: string | null) {
  if (userId) return { userId };
  if (sessionId) return { sessionId };
  return { id: "__none__" };
}
