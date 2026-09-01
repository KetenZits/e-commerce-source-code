import Image from "next/image";
import Link from "next/link";
import { CatalogExportButton } from "@/components/admin/csv-export";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { productImages, sellingPriceCents } from "@/lib/product";
import { serverCaller } from "@/trpc/server";

export default async function AdminProductsPage() {
  const products = await (await serverCaller()).admin.products();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} item{products.length === 1 ? "" : "s"} in the catalog
          </p>
        </div>
        <div className="flex gap-2">
          <CatalogExportButton />
          <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
            New product
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
          No products yet. Create the first one to see it here.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const image = productImages(product.images)[0];
            const stock = product.variants.reduce((sum, variant) => sum + variant.stockQty, 0);
            const reserved = product.variants.reduce((sum, variant) => sum + variant.reservedQty, 0);
            const available = Math.max(0, stock - reserved);
            const minPrice = sellingPriceCents(product);

            return (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
              >
                <div className="relative aspect-[4/5] bg-muted">
                  {image ? (
                    <Image
                      src={image}
                      alt={product.title}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs tracking-[0.14em] text-muted-foreground uppercase">
                      No image
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <StatusChip tone={product.status === "PUBLISHED" ? "forest" : "muted"}>
                      {product.status.toLowerCase()}
                    </StatusChip>
                    {product.fulfillmentType === "DIGITAL" ? (
                      <StatusChip tone="brass">digital</StatusChip>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="eyebrow">{product.brand}</p>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-lg leading-tight">{product.title}</h2>
                    <p className="font-tabular shrink-0 text-sm text-brass">
                      {formatMoney(minPrice, product.currency)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.category.name} · {product.variants.length} variant
                    {product.variants.length === 1 ? "" : "s"}
                  </p>
                  <p className={`text-xs ${available < 1 ? "text-destructive" : "text-muted-foreground"}`}>
                    {available < 1 ? "Out of stock" : `${available} in stock`}
                    {reserved > 0 ? ` · ${reserved} reserved` : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
