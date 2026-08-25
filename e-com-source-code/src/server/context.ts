import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/server/auth";

export async function createContext() {
  const session = await getServerSession(authOptions);
  return { db, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
