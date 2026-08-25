import { randomUUID } from "node:crypto";
import { addMonths } from "date-fns";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { notify } from "@/server/services/notifications";
import { indexProduct } from "@/server/services/search";

export async function fulfillPaidOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { product: true, user: true, license: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID" && order.license) return order;

  const license =
    order.license ??
    (await db.license.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        productId: order.productId,
        licenseKey: randomUUID(),
        maxDownloads: env.MAX_DOWNLOADS,
        expiresAt: addMonths(new Date(), 6),
      },
    }));

  const paid = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", verifiedAt: new Date(), slipUncertain: false },
    });
    await tx.product.update({
      where: { id: order.productId },
      data: { salesCount: { increment: 1 } },
    });
    return updated;
  });

  const product = await db.product.findUnique({ where: { id: order.productId } });
  if (product) await indexProduct(product);

  await notify({
    event: "order.paid",
    subject: `Payment confirmed · ${order.product.title}`,
    text: `${order.user.email} licensed ${order.product.title}. Key ${license.licenseKey}`,
    data: { email: order.user.email, orderId: order.id, licenseKey: license.licenseKey },
  });

  return { ...paid, license };
}
