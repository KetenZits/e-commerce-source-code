import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/server/auth";

export async function createContext() {
  const session = await getServerSession(authOptions);
  const jar = await cookies();
  const hdrs = await headers();
  const cartSessionId = jar.get("cart_sid")?.value ?? null;
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  return { db, session, cartSessionId, ip };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
