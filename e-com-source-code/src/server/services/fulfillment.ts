import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { notify } from "@/server/services/notifications";
import { indexProduct } from "@/server/services/search";
import { writeAuditLog } from "@/server/services/audit";
import { assignDigitalCodesForOrder } from "@/server/services/digital-codes";
import { nextInvoiceNumber } from "@/server/services/invoices";
import {
  convertReservationToSale,
  isLowStock,
  releaseReservation,
  restockSoldItems,
} from "@/server/services/inventory";

function orderItemStock(items: { productVariantId: string; quantity: number; productTitleSnapshot: string }[]) {
  return items.map((item) => ({
    variantId: item.productVariantId,
    quantity: item.quantity,
    title: item.productTitleSnapshot,
  }));
}

export async function fulfillPaidOrder(orderId: string, actorId?: string | null) {
  const existing = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!existing) throw new Error("Order not found");
  if (existing.status !== "PENDING") return existing;

  try {
    const paid = await db.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: existing.id, status: "PENDING" },
        data: {
          status: "PAID",
          verifiedAt: new Date(),
          slipUncertain: false,
          invoiceNumber: existing.invoiceNumber ?? nextInvoiceNumber(),
        },
      });
      if (claimed.count !== 1) {
        return tx.order.findUniqueOrThrow({
          where: { id: existing.id },
          include: { items: true, user: true },
        });
      }

      await convertReservationToSale(tx, orderItemStock(existing.items), existing.id);
      await assignDigitalCodesForOrder(tx, existing.id);

      await tx.paymentTransaction.updateMany({
        where: { orderId: existing.id, status: "PENDING" },
        data: { status: "VERIFIED", verifiedAt: new Date() },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: existing.id,
          status: "PAID",
          note: "PromptPay payment verified.",
        },
      });

      if (existing.promotionCode) {
        await tx.promotion.updateMany({
          where: { code: existing.promotionCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: existing.id },
        include: { items: true, user: true },
      });
    });

    const email = paid.user?.email ?? paid.guestEmail;
    await notify({
      event: "order.paid",
      subject: `Payment confirmed · ${paid.promptpayRef}`,
      text:
        paid.fulfillmentType === "PHYSICAL"
          ? `${email} paid ฿${(paid.totalCents / 100).toFixed(0)}. ${paid.items.length} line(s). Estimated delivery ${paid.estimatedDelivery ?? "—"}.`
          : `${email} paid ฿${(paid.totalCents / 100).toFixed(0)}. ${paid.items.length} line(s). Digital access will appear on the order when ready.`,
      data: { email, orderId: paid.id },
    });

    await writeAuditLog({
      actorId,
      action: "order.paid",
      entityType: "Order",
      entityId: paid.id,
      metadata: { promptpayRef: paid.promptpayRef },
    });

    for (const item of paid.items) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: { product: { include: { category: true, variants: true } } },
      });
      if (variant && isLowStock(variant.stockQty, variant.reservedQty)) {
        await notify({
          event: "inventory.low",
          subject: `Low stock · ${variant.sku}`,
          text: `${variant.product.title} (${variant.sku}) is at ${availableDisplay(variant.stockQty, variant.reservedQty)} units.`,
          data: { email: env.RESEND_FROM },
        });
      }
      if (variant?.product) await indexProduct(variant.product);
    }

    return paid;
  } catch (error) {
    logger.error("Payment fulfillment failed", { orderId, error: String(error) });
    await db.$transaction(async (tx) => {
      const cancelled = await tx.order.updateMany({
        where: { id: existing.id, status: "PENDING" },
        data: {
          status: "CANCELLED",
          slipUncertain: false,
          cancelledAt: new Date(),
        },
      });
      if (cancelled.count === 1) {
        await releaseReservation(
          tx,
          existing.items.map((item) => ({
            variantId: item.productVariantId,
            quantity: item.quantity,
          })),
          existing.id,
          "Released after payment fulfillment failure",
        );
        await tx.orderStatusEvent.create({
          data: {
            orderId: existing.id,
            status: "CANCELLED",
            note: "Order cancelled because stock was no longer available.",
          },
        });
      }
    });
    throw error;
  }
}

function availableDisplay(stockQty: number, reservedQty: number) {
  return Math.max(0, stockQty - reservedQty);
}

export async function cancelPendingOrder(
  orderId: string,
  note: string,
  actorId?: string | null,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.status !== "PENDING") return order;
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        slipUncertain: false,
      },
    });
    if (updated.count !== 1) return order;
    await releaseReservation(
      tx,
      order.items.map((item) => ({
        variantId: item.productVariantId,
        quantity: item.quantity,
      })),
      order.id,
      note,
      actorId,
    );
    await tx.orderStatusEvent.create({
      data: { orderId: order.id, status: "CANCELLED", note },
    });
    return tx.order.findUniqueOrThrow({ where: { id: order.id } });
  });
}

export async function expirePendingOrders() {
  const expired = await db.order.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    select: { id: true },
  });
  for (const order of expired) {
    await cancelPendingOrder(order.id, "PromptPay payment window expired.");
  }
  return expired.length;
}

export async function completeRefund(opts: {
  orderId: string;
  amountCents: number;
  reason: string;
  restock: boolean;
  actorId?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: opts.orderId },
      include: { items: true, refunds: true },
    });
    if (!order) throw new Error("Order not found");
    if (!["PAID", "PACKED", "SHIPPED", "DELIVERED", "REFUNDED"].includes(order.status)) {
      throw new Error("This order cannot be refunded.");
    }
    const already = order.refunds
      .filter((refund) => refund.status === "COMPLETED")
      .reduce((sum, refund) => sum + refund.amountCents, 0);
    if (already + opts.amountCents > order.totalCents) {
      throw new Error("Refund exceeds the paid amount.");
    }

    const refund = await tx.refund.create({
      data: {
        orderId: order.id,
        amountCents: opts.amountCents,
        reason: opts.reason,
        status: "COMPLETED",
        requestedBy: opts.actorId,
        decidedBy: opts.actorId,
        decidedAt: new Date(),
        completedAt: new Date(),
      },
    });

    if (opts.restock) {
      await restockSoldItems(
        tx,
        order.items.map((item) => ({
          variantId: item.productVariantId,
          quantity: item.quantity,
        })),
        order.id,
        opts.actorId,
      );
    }

    const fullyRefunded = already + opts.amountCents >= order.totalCents;
    if (fullyRefunded) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          statusEvents: {
            create: {
              status: "REFUNDED",
              note: opts.reason,
            },
          },
        },
      });
      await tx.paymentTransaction.updateMany({
        where: { orderId: order.id, status: "VERIFIED" },
        data: { status: "REFUNDED" },
      });
    }

    await writeAuditLog(
      {
        actorId: opts.actorId,
        action: "order.refunded",
        entityType: "Order",
        entityId: order.id,
        metadata: { amountCents: opts.amountCents, restock: opts.restock },
      },
      tx,
    );
    return refund;
  });
}

export async function notifyShipped(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order) return;
  const email = order.user?.email ?? order.guestEmail;
  if (!email) return;
  await notify({
    event: "order.shipped",
    subject: `Order shipped · ${order.promptpayRef}`,
    text: `${order.shippingCarrier ?? "Carrier"} ${order.trackingNumber ?? "—"}. Estimated delivery ${order.estimatedDelivery ?? "—"}.`,
    data: { email, orderId: order.id },
  });
}

