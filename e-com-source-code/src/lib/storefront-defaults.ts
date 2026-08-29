import type { z } from "zod";
import type { storefrontSettingsSchema } from "@/server/schemas";

export type StorefrontConfig = z.infer<typeof storefrontSettingsSchema>;
export type StoreMode = StorefrontConfig["storeMode"];

export const DEFAULT_ORBIT_IMAGES = [
  "https://picsum.photos/300/300?grayscale&random=1",
  "https://picsum.photos/300/300?grayscale&random=2",
  "https://picsum.photos/300/300?grayscale&random=3",
  "https://picsum.photos/300/300?grayscale&random=4",
  "https://picsum.photos/300/300?grayscale&random=5",
  "https://picsum.photos/300/300?grayscale&random=6",
];

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  storeMode: "physical",
  siteName: "Atelier",
  siteTagline: "Considered goods for daily use.",
  hero: {
    eyebrow: "Bangkok atelier",
    title: "Goods made to be used, not displayed.",
    body: "A small catalog of apparel, tableware, and leather — photographed as they are, priced in Thai baht, shipped from Bangkok.",
    imageUrl: "",
    orbitImages: DEFAULT_ORBIT_IMAGES,
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
  business: {
    legalName: "Your Company Ltd.",
    contactEmail: "hello@example.com",
    phone: "02-000-0000",
    city: "Bangkok",
    country: "Thailand",
    address: "Replace this address in Admin → Storefront before launch.",
    returnDays: 7,
    documentLanguage: "en",
  },
};
