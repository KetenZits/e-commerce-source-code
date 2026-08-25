import { Suspense } from "react";
import { CatalogControls } from "@/components/catalog/catalog-controls";
import { ProductTile } from "@/components/product/product-tile";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display mb-10 text-3xl">Catalog</h1>
      <Suspense>
        <CatalogControls categories={meta.categories} brands={meta.brands}>
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
          <p className="mt-8 text-sm text-muted-foreground">{products.length} products</p>
        </CatalogControls>
      </Suspense>
    </div>
  );
}
