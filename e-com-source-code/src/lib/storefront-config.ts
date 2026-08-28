import type { z } from "zod";
import { db } from "@/lib/db";
import { storefrontSettingsSchema } from "@/server/schemas";

export type StorefrontConfig = z.infer<typeof storefrontSettingsSchema>;
export type StoreMode = StorefrontConfig["storeMode"];

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  storeMode: "physical",
  siteName: "Atelier",
  siteTagline: "Considered goods for daily use.",
  hero: {
    eyebrow: "Bangkok atelier",
    title: "Goods made to be used, not displayed.",
    body: "A small catalog of apparel, tableware, and leather — photographed as they are, priced in Thai baht, shipped from Bangkok.",
    imageUrl: "",
    primaryLabel: "Shop the catalog",
    primaryHref: "/catalog",
    secondaryLabel: "View featured",
    secondaryHref: "/#featured",
  },
  home: {
    featuredEyebrow: "Studio edit",
    featuredTitle: "Featured",
    newTitle: "New in",
    collectionsTitle: "Collections",
    features: [
      {
        eyebrow: "Payment",
        title: "PromptPay",
        text: "Pay by QR from any Thai bank app. Your order is prepared after the transfer is verified.",
      },
      {
        eyebrow: "Delivery",
        title: "From Bangkok",
        text: "Metro deliveries in two to four days. The rest of Thailand, four to seven.",
      },
      {
        eyebrow: "Catalog",
        title: "In stock, as photographed",
        text: "Each variant carries its own quantity. Out of stock products cannot be checked out.",
      },
    ],
  },
  catalog: {
    eyebrow: "Atelier catalog",
    title: "Objects for everyday use",
    body: "Quiet materials, useful forms, and small-batch pieces selected for daily life. Filter by collection, maker, or price to find the right piece.",
  },
  collections: {
    eyebrow: "The collection",
    title: "Useful pieces, considered slowly.",
    body: "Our collections group material, purpose, and maker rather than seasons. Each piece is selected to settle naturally into everyday routines.",
  },
  delivery: {
    physicalTitle: "Shipping, without surprises.",
    physicalBody: "Every order leaves Bangkok after PromptPay confirmation. We calculate the final rate from destination and packed weight before you pay.",
    digitalTitle: "Digital delivery, directly to your account.",
    digitalBody: "No shipping address is required. After payment is verified, an administrator will securely add your ID, code, or access details to the order.",
  },
};

export async function getStorefrontConfig(): Promise<StorefrontConfig> {
  const row = await db.storeSetting.findUnique({ where: { key: "storefront" } });
  if (!row) return DEFAULT_STOREFRONT_CONFIG;

  try {
    const parsed = storefrontSettingsSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : DEFAULT_STOREFRONT_CONFIG;
  } catch {
    return DEFAULT_STOREFRONT_CONFIG;
  }
}

export async function saveStorefrontConfig(input: StorefrontConfig) {
  const value = JSON.stringify(input);
  await db.storeSetting.upsert({
    where: { key: "storefront" },
    create: { key: "storefront", value },
    update: { value },
  });
  return input;
}
