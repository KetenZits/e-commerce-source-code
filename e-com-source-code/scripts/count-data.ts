import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient();

async function main() {
  const counts = {
    users: await db.user.count(),
    products: await db.product.count(),
    variants: await db.productVariant.count(),
    orders: await db.order.count(),
    cartItems: await db.cartItem.count(),
    addresses: await db.address.count(),
    shippingZones: await db.shippingZone.count(),
  };
  const users = await db.user.findMany({ select: { email: true, role: true } });
  console.log(JSON.stringify({ counts, users }, null, 2));
}

main().finally(() => db.$disconnect());
