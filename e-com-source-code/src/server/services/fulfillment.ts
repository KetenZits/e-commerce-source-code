import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { notify } from "@/server/services/notifications";
import { indexProduct } from "@/server/services/search";

export async function fulfillPaidOrder(orderId: string) {
  const existing = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!existing) throw new Error("Order not found");
  if (existing.status !== "PENDING") return existing;

  try {
    const paid = await db.$transaction(async (tx) => {
      for (const item of existing.items) {
        const updated = await tx.productVariant.updateMany({
          where: { id: item.productVariantId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new Error(`Insufficient stock for ${item.productTitleSnapshot}`);
        }
      }
      return tx.order.update({
        where: { id: existing.id },
        data: {
          status: "PAID",
          verifiedAt: new Date(),
          slipUncertain: false,
          statusEvents: {
            create: {
              status: "PAID",
              note: "PromptPay payment verified.",
            },
          },
        },
        include: { items: true, user: true },
      });
    });

    await notify({
      event: "order.paid",
      subject: `Payment confirmed · ${paid.promptpayRef}`,
      text: `${paid.user.email} paid ฿${(paid.totalCents / 100).toFixed(0)}. ${paid.items.length} line(s). Estimated delivery ${paid.estimatedDelivery ?? "—"}.`,
      data: { email: paid.user.email, orderId: paid.id },
    });

    for (const item of paid.items) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: { product: { include: { category: true, variants: true } } },
      });
      if (variant && variant.stockQty < env.LOW_STOCK_THRESHOLD) {
        await notify({
          event: "inventory.low",
          subject: `Low stock · ${variant.sku}`,
          text: `${variant.product.title} (${variant.sku}) is at ${variant.stockQty} units.`,
          data: { email: env.RESEND_FROM },
        });
      }
      if (variant?.product) await indexProduct(variant.product);
    }

    return paid;
  } catch (error) {
    await db.order.update({
      where: { id: existing.id },
      data: {
        status: "CANCELLED",
        slipUncertain: false,
        statusEvents: {
          create: {
            status: "CANCELLED",
            note: "Order cancelled because stock was no longer available.",
          },
        },
      },
    });
    throw error;
  }
}

export async function notifyShipped(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order || !order.user.email) return;
  await notify({
    event: "order.shipped",
    subject: `Order shipped · ${order.promptpayRef}`,
    text: `${order.shippingCarrier ?? "Carrier"} ${order.trackingNumber ?? "—"}. Estimated delivery ${order.estimatedDelivery ?? "—"}.`,
    data: { email: order.user.email, orderId: order.id },
  });
}
