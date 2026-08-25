import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { serverCaller } from "@/trpc/server";

export default async function AdminProductsPage() {
  const products = await (await serverCaller()).admin.products();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Products</h1>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          New product
        </Button>
      </div>
      <div className="space-y-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm">{product.title}</p>
              <p className="font-tabular text-xs text-muted-foreground">
                {product.slug} · {formatMoney(product.basePriceCents)} · {product.variants.length} variants
              </p>
            </div>
            <StatusChip tone={product.status === "PUBLISHED" ? "forest" : "muted"}>{product.status.toLowerCase()}</StatusChip>
          </Link>
        ))}
      </div>
    </div>
  );
}
