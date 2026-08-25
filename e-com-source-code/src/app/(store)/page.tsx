import Link from "next/link";
import { ProductTile } from "@/components/product/product-tile";
import { SectionDivider } from "@/components/section-divider";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { productImages } from "@/lib/product";

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  const featured = products.map((product) => ({
    ...product,
    images: productImages(product.images),
    inStock: product.variants.some((variant) => variant.stockQty > 0),
    minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16">
      <section className="max-w-2xl space-y-6">
        <p className="eyebrow">Bangkok atelier</p>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Goods made to be used, not displayed.</h1>
        <p className="max-w-lg text-muted-foreground leading-7">
          A small catalog of apparel, tableware, and leather — photographed as they are, priced in Thai baht, shipped from Bangkok.
        </p>
        <Button nativeButton={false} render={<Link href="/catalog" />}>
          Shop the catalog
        </Button>
      </section>

      <SectionDivider />

      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">New in</h2>
          <Link href="/catalog" className="text-sm text-muted-foreground hover:text-primary">
            All products
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
