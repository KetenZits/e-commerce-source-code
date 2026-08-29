import { db } from "@/lib/db";
import { storefrontSettingsSchema } from "@/server/schemas";
import {
  DEFAULT_STOREFRONT_CONFIG,
  type StorefrontConfig,
} from "@/lib/storefront-defaults";

export type { StorefrontConfig, StoreMode } from "@/lib/storefront-defaults";

export async function getStorefrontConfig(): Promise<StorefrontConfig> {
  const row = await db.storeSetting.findUnique({ where: { key: "storefront" } });
  if (!row) return DEFAULT_STOREFRONT_CONFIG;

  try {
    const stored = JSON.parse(row.value) as Partial<StorefrontConfig>;
    const parsed = storefrontSettingsSchema.safeParse({
      ...DEFAULT_STOREFRONT_CONFIG,
      ...stored,
      hero: {
        ...DEFAULT_STOREFRONT_CONFIG.hero,
        ...stored.hero,
        orbitImages:
          stored.hero?.orbitImages?.length
            ? stored.hero.orbitImages
            : DEFAULT_STOREFRONT_CONFIG.hero.orbitImages,
      },
      home: { ...DEFAULT_STOREFRONT_CONFIG.home, ...stored.home },
      catalog: { ...DEFAULT_STOREFRONT_CONFIG.catalog, ...stored.catalog },
      collections: { ...DEFAULT_STOREFRONT_CONFIG.collections, ...stored.collections },
      delivery: { ...DEFAULT_STOREFRONT_CONFIG.delivery, ...stored.delivery },
      business: { ...DEFAULT_STOREFRONT_CONFIG.business, ...stored.business },
    });
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
