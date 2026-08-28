import { Suspense } from "react";
import Link from "next/link";
import { CatalogControls } from "@/components/catalog/catalog-controls";
import { ProductTile } from "@/components/product/product-tile";
import { Reveal } from "@/components/motion/reveal";
import { StaggerItem, StaggerRoot } from "@/components/motion/stagger";
import { SectionDivider } from "@/components/section-divider";
import { ShippingInfo } from "@/components/shipping/shipping-info";
import { getStorefrontConfig } from "@/lib/storefront-config";
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
  const [products, meta, storefront] = await Promise.all([
    caller.product.list(parsed),
    caller.product.filters(),
    getStorefrontConfig(),
  ]);
  const collection = meta.categories.find((category) => category.slug === parsed.category);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span>{collection?.name ?? "Shop"}</span>
      </nav>
      <Reveal className="max-w-2xl space-y-4 py-4">
        <p className="eyebrow">{collection ? "Collection" : storefront.catalog.eyebrow}</p>
        <h1 className="font-display text-4xl">
          {collection?.name ?? storefront.catalog.title}
        </h1>
        <p className="leading-7 text-muted-foreground">
          {storefront.catalog.body}
        </p>
      </Reveal>
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
            <StaggerRoot className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <StaggerItem key={product.id}>
                  <ProductTile product={product} priority={index < 2} />
                </StaggerItem>
              ))}
            </StaggerRoot>
          )}
        </CatalogControls>
      </Suspense>
      <SectionDivider />
      <section className="space-y-6">
        <div>
          <p className="eyebrow">
            {storefront.storeMode === "digital" ? "Digital delivery" : "Shipping"}
          </p>
          <h2 className="font-display mt-2 text-2xl">
            {storefront.storeMode === "digital"
              ? storefront.delivery.digitalTitle
              : "Before your parcel leaves the studio"}
          </h2>
        </div>
        {storefront.storeMode === "digital" ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {storefront.delivery.digitalBody}
          </p>
        ) : (
          <ShippingInfo />
        )}
      </section>
    </div>
  );
}
