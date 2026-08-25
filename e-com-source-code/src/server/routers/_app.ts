import { router } from "@/server/trpc";
import { addressRouter } from "@/server/routers/address";
import { adminRouter } from "@/server/routers/admin";
import { authRouter } from "@/server/routers/auth";
import { cartRouter } from "@/server/routers/cart";
import { orderRouter } from "@/server/routers/order";
import { productRouter } from "@/server/routers/product";

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  cart: cartRouter,
  address: addressRouter,
  order: orderRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
