"use client";

import { useEffect, useState } from "react";
import { ProductTile, type ProductTileData } from "@/components/product/product-tile";
import { rememberProduct, readRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";

export function TrackRecentlyViewed({ product }: { product: RecentProduct }) {
  useEffect(() => {
    rememberProduct(product);
  }, [product.id]);
  return null;
}

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<ProductTileData[]>([]);

  useEffect(() => {
    setItems(
      readRecentlyViewed()
        .filter((item) => item.id !== excludeId)
        .slice(0, 4),
    );
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <section className="space-y-5">
      <h2 className="font-display text-2xl">Recently viewed</h2>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <ProductTile key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
