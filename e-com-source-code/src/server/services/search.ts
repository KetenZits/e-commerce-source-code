import { Prisma } from "@/generated/prisma/client";
import { env, hasMeili } from "@/lib/env";
import { asStringArray } from "@/lib/file-tree";
import type { db as Db } from "@/lib/db";

type ProductRecord = Prisma.ProductGetPayload<object>;

function toDocument(product: ProductRecord) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    tagline: product.tagline,
    category: product.category,
    techStack: asStringArray(product.techStack),
    priceCents: product.priceCents,
    salesCount: product.salesCount,
    status: product.status,
  };
}

async function client() {
  if (!hasMeili()) return null;
  const { Meilisearch } = await import("meilisearch");
  return new Meilisearch({ host: env.MEILI_HOST, apiKey: env.MEILI_API_KEY || undefined });
}

export async function indexProduct(product: ProductRecord) {
  const meili = await client();
  if (!meili) return;
  await meili.index("products").addDocuments([toDocument(product)]);
}

export async function removeProduct(id: string) {
  const meili = await client();
  if (!meili) return;
  await meili.index("products").deleteDocument(id);
}

export async function searchProductIds(query: string): Promise<string[] | null> {
  const meili = await client();
  if (!meili || !query.trim()) return null;
  try {
    const result = await meili.index("products").search(query, { limit: 50 });
    return result.hits.map((hit) => String(hit.id));
  } catch {
    return null;
  }
}

export async function reindexAll(db: typeof Db) {
  const meili = await client();
  if (!meili) return;
  const products = await db.product.findMany({ where: { status: "PUBLISHED" } });
  if (products.length === 0) return;
  const index = meili.index("products");
  await index.updateSearchableAttributes(["title", "tagline", "techStack", "category"]);
  await index.addDocuments(products.map(toDocument));
}
