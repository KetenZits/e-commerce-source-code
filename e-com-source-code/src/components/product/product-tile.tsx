"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

export type ProductTileData = {
  id: string;
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
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const primaryImage = product.images[0];
  const alternateImage = product.images[1];

  return (
    <motion.article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.title} image`}
          className="absolute inset-0 z-10"
        />
        {primaryImage ? (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: alternateImage && hovered ? 0 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        ) : null}
        {alternateImage ? (
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            <Image
              src={alternateImage}
              alt={`${product.title}, alternate view`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        ) : null}
        <WishlistButton
          productId={product.id}
          className="absolute top-3 right-3 z-20"
        />
        {!product.inStock ? (
          <span className="absolute top-3 left-3 z-20 rounded-md border border-destructive/30 bg-card px-2 py-1 text-[10px] tracking-[0.14em] text-destructive uppercase">
            Out of stock
          </span>
        ) : null}
      </div>
      <div className="space-y-1 px-4 py-4">
        <p className="eyebrow">{product.brand}</p>
        <h3 className="font-display text-lg leading-snug">
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h3>
        <p className="font-tabular text-right text-sm text-brass">
          {formatMoney(product.minPriceCents, product.currency)}
        </p>
      </div>
    </motion.article>
  );
}
