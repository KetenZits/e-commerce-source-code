import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma/client";
import { env } from "@/lib/env";

export function availableQty(stockQty: number, reservedQty: number) {
  return Math.max(0, stockQty - reservedQty);
}

type InventoryClient = {
  productVariant: {
    updateMany: Prisma.TransactionClient["productVariant"]["updateMany"];
    findUnique: Prisma.TransactionClient["productVariant"]["findUnique"];
    update: Prisma.TransactionClient["productVariant"]["update"];
  };
  inventoryMovement: {
    create: Prisma.TransactionClient["inventoryMovement"]["create"];
  };
};

async function reserveOne(
  tx: InventoryClient,
  item: { variantId: string; quantity: number; title: string },
  orderId: string,
  actorId?: string | null,
) {
  const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
  if (!variant || availableQty(variant.stockQty, variant.reservedQty) < item.quantity) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${item.title} is out of stock for the selected option.`,
    });
  }
  const updated = await tx.productVariant.updateMany({
    where: {
      id: item.variantId,
      reservedQty: { lte: variant.stockQty - item.quantity },
    },
    data: { reservedQty: { increment: item.quantity } },
  });
  if (updated.count !== 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${item.title} is out of stock for the selected option.`,
    });
  }
  await tx.inventoryMovement.create({
    data: {
      variantId: item.variantId,
      orderId,
      type: "RESERVATION",
      quantity: item.quantity,
      note: "Reserved at checkout",
      actorId: actorId ?? undefined,
    },
  });
}

export async function reserveOrderStock(
  tx: InventoryClient,
  items: { variantId: string; quantity: number; title: string }[],
  orderId: string,
  actorId?: string | null,
) {
  for (const item of items) {
    await reserveOne(tx, item, orderId, actorId);
  }
}

export async function releaseReservation(
  tx: InventoryClient,
  items: { variantId: string; quantity: number }[],
  orderId: string,
  note: string,
  actorId?: string | null,
) {
  for (const item of items) {
    await tx.productVariant.updateMany({
      where: { id: item.variantId, reservedQty: { gte: item.quantity } },
      data: { reservedQty: { decrement: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: "RESERVATION_RELEASE",
        quantity: item.quantity,
        note,
        actorId: actorId ?? undefined,
      },
    });
  }
}

export async function convertReservationToSale(
  tx: InventoryClient,
  items: { variantId: string; quantity: number; title: string }[],
  orderId: string,
) {
  for (const item of items) {
    const updated = await tx.productVariant.updateMany({
      where: {
        id: item.variantId,
        reservedQty: { gte: item.quantity },
        stockQty: { gte: item.quantity },
      },
      data: {
        reservedQty: { decrement: item.quantity },
        stockQty: { decrement: item.quantity },
      },
    });
    if (updated.count !== 1) {
      throw new Error(`Insufficient reserved stock for ${item.title}`);
    }
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: "SALE",
        quantity: item.quantity,
        note: "Converted reservation after payment",
      },
    });
  }
}

export async function restockSoldItems(
  tx: InventoryClient,
  items: { variantId: string; quantity: number }[],
  orderId: string,
  actorId?: string | null,
) {
  for (const item of items) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stockQty: { increment: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId: item.variantId,
        orderId,
        type: "REFUND",
        quantity: item.quantity,
        note: "Restocked after refund",
        actorId: actorId ?? undefined,
      },
    });
  }
}

export async function setStockAbsolute(
  tx: InventoryClient,
  variantId: string,
  stockQty: number,
  reason: string,
  actorId?: string | null,
) {
  const current = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Variant not found." });
  const delta = stockQty - current.stockQty;
  await tx.productVariant.update({
    where: { id: variantId },
    data: { stockQty },
  });
  await tx.inventoryMovement.create({
    data: {
      variantId,
      type: "ADJUSTMENT",
      quantity: delta,
      note: reason,
      actorId: actorId ?? undefined,
    },
  });
  return { ...current, stockQty };
}

export function isLowStock(stockQty: number, reservedQty = 0) {
  return availableQty(stockQty, reservedQty) <= env.LOW_STOCK_THRESHOLD;
}
