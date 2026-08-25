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
    if (input.minPrice != null) and.push({ basePriceCents: { gte: input.minPrice } });
    if (input.maxPrice != null) and.push({ basePriceCents: { lte: input.maxPrice } });
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

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      input.sort === "price-asc"
        ? { basePriceCents: "asc" }
        : input.sort === "price-desc"
          ? { basePriceCents: "desc" }
          : { createdAt: "desc" };

    const products = await ctx.db.product.findMany({
      where,
      orderBy,
      take: 60,
      include: { category: true, variants: true },
    });

    return products.map((product) => ({
      ...product,
      images: productImages(product.images),
      inStock: product.variants.some((variant) => variant.stockQty > 0),
      minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
    }));
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findFirst({
      where: { slug: input.slug, status: "PUBLISHED" },
      include: { category: true, variants: true },
    });
    if (!product) return null;
    return { ...product, images: productImages(product.images) };
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
