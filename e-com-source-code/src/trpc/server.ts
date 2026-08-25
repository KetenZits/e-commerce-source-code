import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/context";

export async function serverCaller() {
  return appRouter.createCaller(await createContext());
}
