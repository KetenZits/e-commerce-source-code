import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(10)
    .max(72)
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number"),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: registerSchema.shape.password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32).max(256),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  password: registerSchema.shape.password,
});

export const setPasswordSchema = z.object({
  password: registerSchema.shape.password,
});

export const catalogQuerySchema = z.object({
  q: z.string().optional().default(""),
  brand: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().int().optional(),
  maxPrice: z.number().int().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional().default("newest"),
  page: z.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.number().int().min(1).max(60).optional().default(24),
});

export const addressSchema = z.object({
  recipientName: z.string().min(2).max(80),
  phone: z.string().min(8).max(20),
  addressLine1: z.string().min(4).max(160),
  addressLine2: z.string().max(160).optional().or(z.literal("")),
  subdistrict: z.string().min(2).max(80),
  district: z.string().min(2).max(80),
  province: z.string().min(2).max(80),
  postalCode: z.string().min(4).max(10),
  isDefault: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productVariantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1).optional(),
  shippingZoneId: z.string().min(1).optional(),
  promotionCode: z.string().trim().min(2).max(64).optional(),
  idempotencyKey: z.string().min(16).max(191).optional(),
  guest: z
    .object({
      email: z.string().trim().toLowerCase().email(),
      name: z.string().trim().min(2).max(80),
      phone: z.string().trim().min(8).max(20).optional(),
    })
    .optional(),
  shippingAddress: addressSchema.omit({ isDefault: true }).optional(),
  billingDetails: z
    .object({
      name: z.string().trim().min(2).max(120),
      taxId: z.string().trim().min(10).max(20),
      address: z.string().trim().min(8).max(500),
      branch: z.string().trim().max(80).optional(),
    })
    .optional(),
});

export const orderIdSchema = z.object({
  orderId: z.string().min(1),
  guestToken: z.string().min(16).max(256).optional(),
});

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(2).max(64),
  attributes: z.record(z.string(), z.string()),
  priceCents: z.number().int().positive(),
  stockQty: z.number().int().min(0),
  weightGrams: z.number().int().min(0),
  imageUrl: z.string().optional().or(z.literal("")),
});

export const productFormSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes"),
  title: z.string().min(3).max(120),
  description: z.string().min(20),
  brand: z.string().min(2).max(80),
  categoryId: z.string().min(1),
  basePriceCents: z.number().int().positive(),
  currency: z.string(),
  images: z.array(z.string().min(1)).min(1),
  imageAltTexts: z.array(z.string().trim().max(160)).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  fulfillmentType: z.enum(["PHYSICAL", "DIGITAL"]).default("PHYSICAL"),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  variants: z.array(variantInputSchema).min(1),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes"),
  parentId: z.string().nullable().optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export const shippingZoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  provinces: z.array(z.string()).min(1),
  minWeightGrams: z.number().int().min(0),
  maxWeightGrams: z.number().int().nullable(),
  feeCents: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
});

export const stockAdjustSchema = z.object({
  variantId: z.string().min(1),
  stockQty: z.number().int().min(0),
  reason: z.string().trim().min(3).max(191).optional(),
});

export const fulfillSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
});

export const paymentSettingsSchema = z.object({
  promptpayId: z
    .string()
    .min(10)
    .max(13)
    .regex(/^[0-9]+$/, "Use a Thai mobile number or national ID, digits only"),
  accountName: z.string().min(2).max(80),
  paymentMode: z.enum(["demo", "live"]),
});

const contentField = z.string().trim().min(1).max(500);
const linkField = z.string().trim().startsWith("/").max(200);

export const storefrontSettingsSchema = z.object({
  storeMode: z.enum(["physical", "digital"]),
  siteName: z.string().trim().min(2).max(80),
  siteTagline: z.string().trim().min(2).max(180),
  hero: z.object({
    eyebrow: contentField,
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().min(2).max(600),
    imageUrl: z.string().trim().max(2000),
    orbitImages: z.array(z.string().trim().min(1).max(2000)).max(8),
    primaryLabel: contentField,
    primaryHref: linkField,
    secondaryLabel: contentField,
    secondaryHref: linkField,
  }),
  home: z.object({
    featuredEyebrow: contentField,
    featuredTitle: contentField,
    newTitle: contentField,
    collectionsTitle: contentField,
    features: z
      .array(
        z.object({
          eyebrow: contentField,
          title: contentField,
          text: z.string().trim().min(2).max(400),
        }),
      )
      .length(3),
  }),
  catalog: z.object({
    eyebrow: contentField,
    title: contentField,
    body: z.string().trim().min(2).max(600),
  }),
  collections: z.object({
    eyebrow: contentField,
    title: contentField,
    body: z.string().trim().min(2).max(600),
  }),
  delivery: z.object({
    physicalTitle: contentField,
    physicalBody: z.string().trim().min(2).max(600),
    digitalTitle: contentField,
    digitalBody: z.string().trim().min(2).max(600),
  }),
  business: z.object({
    legalName: z.string().trim().min(2).max(160),
    contactEmail: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(6).max(32),
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    address: z.string().trim().max(500),
    returnDays: z.number().int().min(0).max(90),
    documentLanguage: z.enum(["en", "th"]),
  }),
});

export const stockAlertSchema = z.object({
  variantId: z.string().min(1),
  email: z.string().trim().toLowerCase().email(),
});

export const digitalDeliverySchema = z.object({
  orderId: z.string().min(1),
  content: z.string().trim().min(4).max(10000),
});

export const digitalCodeImportSchema = z.object({
  variantId: z.string().min(1),
  codes: z.array(z.string().trim().min(2).max(10_000)).min(1).max(500),
});

export const promotionSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().trim().toUpperCase().min(2).max(64),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional().or(z.literal("")),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().int().positive(),
    minSubtotalCents: z.number().int().min(0).default(0),
    maxDiscountCents: z.number().int().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    active: z.boolean().default(true),
    startsAt: z.date().nullable().optional(),
    endsAt: z.date().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "PERCENTAGE" && value.value > 10_000) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage value cannot exceed 10000 basis points",
      });
    }
    if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be after start date",
      });
    }
  });

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(3000),
});

export const reviewSettingsSchema = z.object({
  autoPublish: z.boolean(),
});

export const reviewModerationSchema = z.object({
  reviewId: z.string().min(1),
  status: z.enum(["PUBLISHED", "REJECTED"]),
  adminNote: z.string().trim().max(1000).optional(),
});

export const refundSchema = z.object({
  orderId: z.string().min(1),
  amountCents: z.number().int().positive(),
  reason: z.string().trim().min(5).max(2000),
  restock: z.boolean().default(true),
});

export const customerCancellationSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});

export const taxSettingsSchema = z.object({
  enabled: z.boolean(),
  rateBps: z.number().int().min(0).max(10_000),
  inclusive: z.boolean(),
  businessName: z.string().trim().min(2).max(160),
  taxId: z.string().trim().max(32),
  address: z.string().trim().max(500),
});
