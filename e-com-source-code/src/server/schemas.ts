import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const catalogQuerySchema = z.object({
  q: z.string().optional().default(""),
  brand: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().int().optional(),
  maxPrice: z.number().int().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional().default("newest"),
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
  addressId: z.string().min(1),
  shippingZoneId: z.string().min(1),
});

export const orderIdSchema = z.object({
  orderId: z.string().min(1),
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
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  variants: z.array(variantInputSchema).min(1),
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
});

export const fulfillSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
});
