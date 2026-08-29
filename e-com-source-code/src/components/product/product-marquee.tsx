"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import type { ProductTileData } from "@/components/product/product-tile";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ProductMarquee({
  products,
  className,
}: {
  products: ProductTileData[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const items = products.filter((product) => product.images[0]).slice(0, 8);
  if (items.length < 2) return null;

  return (
    <div
      className={cn(
        "product-marquee -mx-4 px-4 py-4",
        className,
      )}
      aria-label="More products"
      data-motion={reduceMotion ? "reduced" : "marquee"}
    >
      <div className="product-marquee-track">
        <div className="flex gap-4 pr-4">
          {items.map((product) => (
            <MarqueeCard key={product.id} product={product} />
          ))}
        </div>
        {!reduceMotion ? (
          <div className="flex gap-4 pr-4" aria-hidden>
            {items.map((product) => (
              <MarqueeCard key={`clone-${product.id}`} product={product} clone />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MarqueeCard({
  product,
  clone = false,
}: {
  product: ProductTileData;
  clone?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      tabIndex={clone ? -1 : undefined}
      className="group block w-[min(70vw,17rem)] shrink-0 sm:w-64"
    >
      <div className="premium-depth relative aspect-4/5 overflow-hidden rounded-2xl bg-muted">
        <Image
          src={product.images[0]}
          alt={clone ? "" : product.title}
          fill
          loading="lazy"
          sizes="(min-width: 640px) 256px, 70vw"
          className="object-cover transition-transform duration-700 ease-(--motion-premium) group-hover:scale-[1.045]"
        />
        <span className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-foreground/18 to-transparent" />
      </div>
      <div className="mt-3.5 space-y-1 px-0.5">
        <p className="eyebrow truncate">{product.brand}</p>
        <p className="font-display line-clamp-2 text-base leading-snug transition-colors duration-300 group-hover:text-primary">
          {product.title}
        </p>
        <p className="font-tabular text-sm text-brass">
          {formatMoney(product.minPriceCents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
