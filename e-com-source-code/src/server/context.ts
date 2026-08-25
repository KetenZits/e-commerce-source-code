import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/server/auth";

export async function createContext() {
  const session = await getServerSession(authOptions);
  const jar = await cookies();
  const cartSessionId = jar.get("cart_sid")?.value ?? null;
  return { db, session, cartSessionId };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
