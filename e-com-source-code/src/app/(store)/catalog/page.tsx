import { Suspense } from "react";
import Link from "next/link";
import { CatalogControls } from "@/components/catalog/catalog-controls";
import { ProductTile } from "@/components/product/product-tile";
import { SectionDivider } from "@/components/section-divider";
import { ShippingInfo } from "@/components/shipping/shipping-info";
import { catalogQuerySchema } from "@/server/schemas";
import { serverCaller } from "@/trpc/server";

type Search = { q?: string; brand?: string; category?: string; min?: string; max?: string; sort?: string };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const parsed = catalogQuerySchema.parse({
    q: raw.q ?? "",
    brand: raw.brand,
    category: raw.category,
    minPrice: raw.min ? Number(raw.min) * 100 : undefined,
    maxPrice: raw.max ? Number(raw.max) * 100 : undefined,
    sort: raw.sort,
  });
  const caller = await serverCaller();
  const [products, meta] = await Promise.all([caller.product.list(parsed), caller.product.filters()]);
  const collection = meta.categories.find((category) => category.slug === parsed.category);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span>{collection?.name ?? "Shop"}</span>
      </nav>
      <section className="max-w-2xl space-y-4 py-4">
        <p className="eyebrow">{collection ? "Collection" : "Atelier catalog"}</p>
        <h1 className="font-display text-4xl">
          {collection?.name ?? "Objects for everyday use"}
        </h1>
        <p className="leading-7 text-muted-foreground">
          Quiet materials, useful forms, and small-batch pieces selected for daily life.
          Filter by collection, maker, or price to find the right piece.
        </p>
      </section>
      <Suspense fallback={<div className="h-28 rounded-xl border border-border bg-card" />}>
        <CatalogControls categories={meta.categories} brands={meta.brands}>
          <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
            <span>{products.length} products</span>
            {collection ? (
              <Link href="/catalog" className="text-primary">View all</Link>
            ) : null}
          </div>
          {products.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
              No products match these filters. Try clearing a collection or brand.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductTile key={product.id} product={product} />
              ))}
            </div>
          )}
        </CatalogControls>
      </Suspense>
      <SectionDivider />
      <section className="space-y-6">
        <div>
          <p className="eyebrow">Shipping</p>
          <h2 className="font-display mt-2 text-2xl">Before your parcel leaves the studio</h2>
        </div>
        <ShippingInfo />
      </section>
    </div>
  );
}
