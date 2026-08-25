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
  stack: z.array(z.string()).optional().default([]),
  category: z.string().optional(),
  minPrice: z.number().int().optional(),
  maxPrice: z.number().int().optional(),
  sort: z.enum(["newest", "bestselling", "price-asc", "price-desc"]).optional().default("newest"),
});

export const productFormSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes"),
  title: z.string().min(3).max(120),
  tagline: z.string().min(8).max(180),
  description: z.string().min(20),
  authorName: z.string().min(2).max(80),
  priceCents: z.number().int().positive(),
  currency: z.string(),
  techStack: z.array(z.string()).min(1),
  category: z.string().min(2),
  coverLang: z.string().min(1),
  coverCode: z.string().min(4),
  demoUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  previewFiles: z
    .array(
      z.object({
        path: z.string().min(1),
        language: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .min(1),
});

export const checkoutSchema = z.object({
  productId: z.string().min(1),
});

export const orderIdSchema = z.object({
  orderId: z.string().min(1),
});
