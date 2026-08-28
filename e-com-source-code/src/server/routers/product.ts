import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { catalogQuerySchema } from "@/server/schemas";
import { publicProcedure, router } from "@/server/trpc";
import { searchProductIds } from "@/server/services/search";
import { productImages } from "@/lib/product";

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
    if (and.length) where.AND = and;

    const products = await ctx.db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { category: true, variants: true },
    });

    const mapped = products.map((product) => ({
      ...product,
      images: productImages(product.images),
      inStock: product.variants.some((variant) => variant.stockQty > 0),
      minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
    }));
    const filtered = mapped.filter(
      (product) =>
        (input.minPrice == null || product.minPriceCents >= input.minPrice) &&
        (input.maxPrice == null || product.minPriceCents <= input.maxPrice)
    );
    if (input.sort === "price-asc") {
      filtered.sort((a, b) => a.minPriceCents - b.minPriceCents);
    } else if (input.sort === "price-desc") {
      filtered.sort((a, b) => b.minPriceCents - a.minPriceCents);
    }
    return filtered;
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findFirst({
      where: { slug: input.slug, status: "PUBLISHED" },
      include: { category: true, variants: true },
    });
    if (!product) return null;
    return { ...product, images: productImages(product.images) };
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
          inStock: product.variants.some((variant) => variant.stockQty > 0),
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
          inStock: product.variants.some((variant) => variant.stockQty > 0),
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
      inStock: product.variants.some((variant) => variant.stockQty > 0),
      minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
    }));
  }),

  filters: publicProcedure.query(async ({ ctx }) => {
    const [categories, brands] = await Promise.all([
      ctx.db.category.findMany({ orderBy: { name: "asc" } }),
      ctx.db.product.findMany({
        where: { status: "PUBLISHED" },
        select: { brand: true },
        distinct: ["brand"],
      }),
    ]);
    return { categories, brands: brands.map((row) => row.brand) };
  }),
});
