import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type PromotionClient = Pick<Prisma.TransactionClient, "promotion">;

export async function resolvePromotion(
  code: string | undefined,
  subtotalCents: number,
  client: PromotionClient = db,
) {
  if (!code) return { promotion: null, discountCents: 0 };

  const normalized = code.trim().toUpperCase();
  const promotion = await client.promotion.findUnique({
    where: { code: normalized },
  });
  const now = new Date();
  const unavailable =
    !promotion ||
    !promotion.active ||
    (promotion.startsAt && promotion.startsAt > now) ||
    (promotion.endsAt && promotion.endsAt < now) ||
    (promotion.usageLimit !== null &&
      promotion.usageCount >= promotion.usageLimit);

  if (unavailable) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This promotion code is not available.",
    });
  }
  if (subtotalCents < promotion.minSubtotalCents) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The order does not meet this promotion's minimum spend.",
    });
  }

  const rawDiscount =
    promotion.type === "PERCENTAGE"
      ? Math.round((subtotalCents * promotion.value) / 10_000)
      : promotion.value;
  const discountCents = Math.max(
    0,
    Math.min(
      subtotalCents,
      promotion.maxDiscountCents === null
        ? rawDiscount
        : Math.min(rawDiscount, promotion.maxDiscountCents),
    ),
  );

  return { promotion, discountCents };
}
