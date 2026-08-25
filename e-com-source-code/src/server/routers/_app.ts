import { router } from "@/server/trpc";
import { adminRouter } from "@/server/routers/admin";
import { authRouter } from "@/server/routers/auth";
import { licenseRouter } from "@/server/routers/license";
import { orderRouter } from "@/server/routers/order";
import { productRouter } from "@/server/routers/product";

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  order: orderRouter,
  license: licenseRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
