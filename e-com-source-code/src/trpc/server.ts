import { getServerSession } from "next-auth";
import { appRouter } from "@/server/routers/_app";
import { authOptions } from "@/server/auth";
import { db } from "@/lib/db";

export async function serverCaller() {
  const session = await getServerSession(authOptions);
  return appRouter.createCaller({ db, session });
}
