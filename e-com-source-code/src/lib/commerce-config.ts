import type { z } from "zod";
import { db } from "@/lib/db";
import { taxSettingsSchema } from "@/server/schemas";

export type TaxConfig = z.infer<typeof taxSettingsSchema>;

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  enabled: false,
  rateBps: 700,
  inclusive: true,
  businessName: "Atelier",
  taxId: "",
  address: "",
};

export async function getTaxConfig(): Promise<TaxConfig> {
  const row = await db.storeSetting.findUnique({ where: { key: "tax" } });
  if (!row) return DEFAULT_TAX_CONFIG;

  try {
    const parsed = taxSettingsSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : DEFAULT_TAX_CONFIG;
  } catch {
    return DEFAULT_TAX_CONFIG;
  }
}

export async function saveTaxConfig(input: TaxConfig) {
  await db.storeSetting.upsert({
    where: { key: "tax" },
    create: { key: "tax", value: JSON.stringify(input) },
    update: { value: JSON.stringify(input) },
  });
  return input;
}

export function calculateTax(amountCents: number, config: TaxConfig) {
  if (!config.enabled || config.rateBps <= 0) {
    return { taxCents: 0, totalBeforeShippingCents: amountCents };
  }

  if (config.inclusive) {
    return {
      taxCents: Math.round(
        (amountCents * config.rateBps) / (10_000 + config.rateBps),
      ),
      totalBeforeShippingCents: amountCents,
    };
  }

  const taxCents = Math.round((amountCents * config.rateBps) / 10_000);
  return {
    taxCents,
    totalBeforeShippingCents: amountCents + taxCents,
  };
}
