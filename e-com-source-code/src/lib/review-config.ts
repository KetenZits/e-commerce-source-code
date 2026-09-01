import type { z } from "zod";
import { db } from "@/lib/db";
import { reviewSettingsSchema } from "@/server/schemas";

export type ReviewConfig = z.infer<typeof reviewSettingsSchema>;

export const DEFAULT_REVIEW_CONFIG: ReviewConfig = {
  autoPublish: true,
};

export async function getReviewConfig(): Promise<ReviewConfig> {
  const row = await db.storeSetting.findUnique({ where: { key: "reviews" } });
  if (!row) return DEFAULT_REVIEW_CONFIG;
  try {
    const parsed = reviewSettingsSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : DEFAULT_REVIEW_CONFIG;
  } catch {
    return DEFAULT_REVIEW_CONFIG;
  }
}

export async function saveReviewConfig(input: ReviewConfig) {
  await db.storeSetting.upsert({
    where: { key: "reviews" },
    create: { key: "reviews", value: JSON.stringify(input) },
    update: { value: JSON.stringify(input) },
  });
  return input;
}
