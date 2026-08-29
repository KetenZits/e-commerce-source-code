import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { catalogQuerySchema, stockAlertSchema } from "@/server/schemas";
import { publicProcedure, router } from "@/server/trpc";
import { searchProductIds } from "@/server/services/search";
import { productImages } from "@/lib/product";
import { availableQty } from "@/server/services/inventory";
import { upsertStockAlert } from "@/server/services/stock-alert-store";

export const productRouter = router({
  list: publicProcedure.input(catalogQuerySchema).query(async ({ ctx, input }) => {
    const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
    const and: Prisma.ProductWhereInput[] = [];
    if (input.category) {
      and.push({
        OR: [{ category: { slug: input.category } }, { category: { parent: { slug: input.category } } }],
      });
    }
    if (input.brand) and.push({ brand: input.brand });
    if (input.q.trim()) {
      const ids = await searchProductIds(input.q);
      if (ids) and.push({ id: { in: ids } });
      else {
        and.push({
          OR: [
            { title: { contains: input.q } },
            { brand: { contains: input.q } },
            { slug: { contains: input.q } },
          ],
        });
      }
    }
    if (input.minPrice != null) {
      and.push({ variants: { some: { priceCents: { gte: input.minPrice } } } });
    }
    if (input.maxPrice != null) {
      and.push({ variants: { some: { priceCents: { lte: input.maxPrice } } } });
    }
    if (and.length) where.AND = and;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      input.sort === "newest" ? { createdAt: "desc" } : { createdAt: "desc" };

    const total = await ctx.db.product.count({ where });
    const products = await ctx.db.product.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { category: true, variants: true },
    });

    const items = products.map((product) => ({
      ...product,
      images: productImages(product.images),
      inStock: product.variants.some(
        (variant) => availableQty(variant.stockQty, variant.reservedQty) > 0,
      ),
      minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
    }));
    if (input.sort === "price-asc") items.sort((a, b) => a.minPriceCents - b.minPriceCents);
    if (input.sort === "price-desc") items.sort((a, b) => b.minPriceCents - a.minPriceCents);

    return {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findFirst({
      where: { slug: input.slug, status: "PUBLISHED" },
      include: { category: true, variants: true },
    });
    if (!product) return null;
    const reviews = await ctx.db.review.findMany({
      where: { productId: product.id, status: "PUBLISHED" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const rating =
      reviews.length === 0
        ? null
        : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    return {
      ...product,
      images: productImages(product.images),
      reviews,
      rating,
      reviewCount: reviews.length,
    };
  }),

  related: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        excludeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: input.excludeId },
        },
        include: { category: true, variants: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      });
      return products
        .sort(
          (a, b) =>
            Number(b.categoryId === input.categoryId) -
            Number(a.categoryId === input.categoryId),
        )
        .slice(0, 8)
        .map((product) => ({
          ...product,
          images: productImages(product.images),
          inStock: product.variants.some(
            (variant) => availableQty(variant.stockQty, variant.reservedQty) > 0,
          ),
          minPriceCents: Math.min(
            ...product.variants.map((variant) => variant.priceCents),
            product.basePriceCents,
          ),
        }));
    }),

  byIds: publicProcedure
    .input(z.object({ ids: z.array(z.string()).max(100) }))
    .query(async ({ ctx, input }) => {
      if (!input.ids.length) return [];
      const products = await ctx.db.product.findMany({
        where: { id: { in: input.ids }, status: "PUBLISHED" },
        include: { category: true, variants: true },
      });
      const rank = new Map(input.ids.map((id, index) => [id, index]));
      return products
        .map((product) => ({
          ...product,
          images: productImages(product.images),
          inStock: product.variants.some(
            (variant) => availableQty(variant.stockQty, variant.reservedQty) > 0,
          ),
          minPriceCents: Math.min(
            ...product.variants.map((variant) => variant.priceCents),
            product.basePriceCents
          ),
        }))
        .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    }),

  featured: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return products.map((product) => ({
      ...product,
      images: productImages(product.images),
      inStock: product.variants.some(
        (variant) => availableQty(variant.stockQty, variant.reservedQty) > 0,
      ),
      minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
    }));
  }),

  filters: publicProcedure.query(async ({ ctx }) => {
    const [categories, brands] = await Promise.all([
      ctx.db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      ctx.db.product.findMany({
        where: { status: "PUBLISHED" },
        select: { brand: true },
        distinct: ["brand"],
      }),
    ]);
    return { categories, brands: brands.map((row) => row.brand) };
  }),

  createStockAlert: publicProcedure.input(stockAlertSchema).mutation(async ({ ctx, input }) => {
    const variant = await ctx.db.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: { select: { id: true, status: true } } },
    });
    if (!variant || variant.product.status !== "PUBLISHED") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Product not found." });
    }
    if (availableQty(variant.stockQty, variant.reservedQty) > 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This variant is already in stock." });
    }
    await upsertStockAlert(ctx.db, {
      email: input.email,
      variantId: variant.id,
      productId: variant.product.id,
    });
    return { ok: true };
  }),
});
