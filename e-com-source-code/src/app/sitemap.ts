import { db } from "@/lib/db";

export default async function sitemap() {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const products = await db.product.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
  const categories = await db.category.findMany({ select: { slug: true } });
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/catalog`, lastModified: new Date() },
    { url: `${base}/categories` },
    { url: `${base}/shipping` },
    { url: `${base}/legal/terms` },
    { url: `${base}/legal/privacy` },
    { url: `${base}/legal/returns` },
    { url: `${base}/legal/contact` },
    ...categories.map((category) => ({ url: `${base}/catalog?category=${category.slug}` })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updatedAt,
    })),
  ];
}
