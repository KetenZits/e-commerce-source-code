import { Suspense } from "react";
import { CatalogControls } from "@/components/catalog/catalog-controls";
import { CodeCard } from "@/components/product/code-card";
import { catalogQuerySchema } from "@/server/schemas";
import { serverCaller } from "@/trpc/server";

type Search = { q?: string; stack?: string | string[]; category?: string; min?: string; max?: string; sort?: string };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const stacks = Array.isArray(raw.stack) ? raw.stack : raw.stack ? [raw.stack] : [];
  const parsed = catalogQuerySchema.parse({
    q: raw.q ?? "",
    stack: stacks,
    category: raw.category,
    minPrice: raw.min ? Number(raw.min) * 100 : undefined,
    maxPrice: raw.max ? Number(raw.max) * 100 : undefined,
    sort: raw.sort,
  });

  const caller = await serverCaller();
  const [products, meta] = await Promise.all([caller.product.list(parsed), caller.product.stacks()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
        <Suspense>
          <CatalogControls stacks={meta.stacks} categories={meta.categories}>
            {products.length === 0 ? (
              <pre className="rounded-lg border border-hair bg-void p-6 font-mono text-sm text-muted-foreground">
                {`no matches for "${parsed.q || parsed.stack.join(" · ") || parsed.category || "these filters"}"\ntry clearing the stack filter.`}
              </pre>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <CodeCard key={product.id} product={product} href={`/products/${product.slug}`} />
                ))}
              </div>
            )}
            <p className="util-label mt-6">{products.length} listings</p>
          </CatalogControls>
        </Suspense>
    </div>
  );
}
