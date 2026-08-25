import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { catalogQuerySchema } from "@/server/schemas";
import { publicProcedure, router } from "@/server/trpc";
import { searchProductIds } from "@/server/services/search";
import { asStringArray } from "@/lib/file-tree";

export const productRouter = router({
  list: publicProcedure.input(catalogQuerySchema).query(async ({ ctx, input }) => {
    const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
    const and: Prisma.ProductWhereInput[] = [];

    if (input.category) and.push({ category: input.category });
    if (input.minPrice != null) and.push({ priceCents: { gte: input.minPrice } });
    if (input.maxPrice != null) and.push({ priceCents: { lte: input.maxPrice } });

    if (input.q.trim()) {
      const ids = await searchProductIds(input.q);
      if (ids) {
        and.push({ id: { in: ids } });
      } else {
        and.push({
          OR: [
            { title: { contains: input.q } },
            { tagline: { contains: input.q } },
            { slug: { contains: input.q } },
          ],
        });
      }
    }

    if (and.length) where.AND = and;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      input.sort === "bestselling"
        ? { salesCount: "desc" }
        : input.sort === "price-asc"
          ? { priceCents: "asc" }
          : input.sort === "price-desc"
            ? { priceCents: "desc" }
            : { createdAt: "desc" };

    const products = await ctx.db.product.findMany({ where, orderBy, take: 60 });

    const filtered = input.stack.length
      ? products.filter((product) => {
          const stack = asStringArray(product.techStack);
          return input.stack.every((item) => stack.includes(item));
        })
      : products;

    return filtered;
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.product.findFirst({
      where: { slug: input.slug, status: "PUBLISHED" },
    });
  }),

  featured: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { salesCount: "desc" },
      take: 3,
    });
  }),

  stacks: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { techStack: true, category: true },
    });
    const stacks = new Set<string>();
    const categories = new Set<string>();
    for (const product of products) {
      asStringArray(product.techStack).forEach((item) => stacks.add(item));
      categories.add(product.category);
    }
    return { stacks: [...stacks].sort(), categories: [...categories].sort() };
  }),
});
