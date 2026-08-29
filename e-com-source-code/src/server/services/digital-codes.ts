import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma/client";
import {
  decryptDigitalDelivery,
  encryptDigitalDelivery,
} from "@/server/services/digital-delivery";

type CodeClient = {
  digitalCode: Prisma.TransactionClient["digitalCode"];
};

export async function importDigitalCodes(
  tx: CodeClient,
  variantId: string,
  codes: string[],
) {
  const unique = [...new Set(codes.map((code) => code.trim()).filter(Boolean))];
  for (const code of unique) {
    await tx.digitalCode.create({
      data: {
        variantId,
        encryptedContent: encryptDigitalDelivery(code),
        status: "AVAILABLE",
      },
    });
  }
  return unique.length;
}

export async function assignDigitalCodesForOrder(
  tx: CodeClient & {
    orderItem: Prisma.TransactionClient["orderItem"];
    order: Prisma.TransactionClient["order"];
  },
  orderId: string,
) {
  const items = await tx.orderItem.findMany({
    where: { orderId, fulfillmentTypeSnapshot: { in: ["DIGITAL", "MIXED"] } },
  });
  const assigned: string[] = [];
  for (const item of items) {
    const available = await tx.digitalCode.findMany({
      where: { variantId: item.productVariantId, status: "AVAILABLE" },
      take: item.quantity,
      orderBy: { createdAt: "asc" },
    });
    if (available.length < item.quantity) continue;
    for (const code of available) {
      await tx.digitalCode.update({
        where: { id: code.id },
        data: {
          status: "DELIVERED",
          orderItemId: item.id,
          reservedAt: new Date(),
          deliveredAt: new Date(),
        },
      });
      const plain = decryptDigitalDelivery(code.encryptedContent);
      if (plain) assigned.push(plain);
    }
  }
  if (!assigned.length) return null;
  const content = assigned.join("\n");
  await tx.order.update({
    where: { id: orderId },
    data: {
      digitalDeliveryEncrypted: encryptDigitalDelivery(content),
      digitalDeliveredAt: new Date(),
    },
  });
  return content;
}

export async function revokeCodesForOrder(tx: CodeClient, orderItemIds: string[]) {
  if (!orderItemIds.length) return;
  await tx.digitalCode.updateMany({
    where: { orderItemId: { in: orderItemIds } },
    data: { status: "REVOKED", deliveredAt: null },
  });
}

export function requireAvailableCodesOrManual(assigned: string | null, needed: boolean) {
  if (needed && !assigned) {
    return "Digital codes will be delivered by the store after payment.";
  }
  return assigned;
}

export function missingPoolError(title: string): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `No digital codes are available for ${title}.`,
  });
}
