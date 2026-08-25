import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type ProductTileData = {
  slug: string;
  title: string;
  brand: string;
  images: string[];
  minPriceCents: number;
  currency: string;
  inStock: boolean;
  category?: { name: string };
};

export function ProductTile({ product, className }: { product: ProductTileData; className?: string }) {
  const image = product.images[0];
  return (
    <Link href={`/products/${product.slug}`} aria-label={product.title} className={cn("group block", className)}>
      <article className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative aspect-[4/5] bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
          {!product.inStock ? (
            <span className="absolute top-3 left-3 rounded-md border border-destructive/30 bg-card px-2 py-1 text-[10px] tracking-[0.14em] text-destructive uppercase">
              Out of stock
            </span>
          ) : null}
        </div>
        <div className="space-y-1 px-4 py-4">
          <p className="eyebrow">{product.brand}</p>
          <h3 className="font-display text-lg leading-snug">{product.title}</h3>
          <p className="font-tabular text-right text-sm text-brass">{formatMoney(product.minPriceCents, product.currency)}</p>
        </div>
      </article>
    </Link>
  );
}
