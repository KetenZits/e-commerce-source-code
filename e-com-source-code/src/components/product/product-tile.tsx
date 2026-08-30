"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { useI18n } from "@/components/i18n/locale-provider";
import { TiltCard } from "@/components/motion/tilt-card";

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

export function ProductTile({
  product,
  className,
  priority = false,
}: {
  product: ProductTileData;
  className?: string;
  priority?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const primaryImage = product.images[0];
  const alternateImage = product.images[1];
  const showAlternate = Boolean(alternateImage && hovered && !reduceMotion);

  return (
    <TiltCard className={cn("h-full", className)} intensity={4}>
      <article
        className="group relative h-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link
          href={`/products/${product.slug}`}
          className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <div className="product-tile-frame premium-depth relative aspect-4/5 overflow-hidden rounded-2xl bg-muted">
            {primaryImage ? (
              <>
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: showAlternate ? 0 : 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.4 }}
                >
                  <Image
                    src={primaryImage}
                    alt=""
                    fill
                    priority={priority}
                    sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-(--motion-premium) group-hover:scale-[1.045]"
                  />
                </motion.div>
                {alternateImage ? (
                  <motion.div
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: showAlternate ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4 }}
                  >
                    <Image
                      src={alternateImage}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 40vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-(--motion-premium) group-hover:scale-[1.045]"
                    />
                  </motion.div>
                ) : null}
              </>
            ) : (
              <div className="flex size-full items-center justify-center px-6 text-center">
                <p className="eyebrow">{t("product.noPhoto")}</p>
              </div>
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-foreground/18 to-transparent" />
            {!product.inStock ? (
              <div className="absolute inset-0 z-10 bg-background/35">
                <span className="absolute bottom-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase shadow-sm backdrop-blur-sm">
                  {t("product.outOfStock")}
                </span>
              </div>
            ) : null}
          </div>
          <div className="mt-3.5 space-y-1.5 px-0.5">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow truncate">{product.brand}</p>
              {product.category?.name ? (
                <p className="truncate text-[11px] text-muted-foreground">{product.category.name}</p>
              ) : null}
            </div>
            <h3 className="font-display line-clamp-2 text-[1.15rem] leading-snug transition-colors duration-300 group-hover:text-primary">
              {product.title}
            </h3>
            <p className="font-tabular text-sm text-brass">
              {formatMoney(product.minPriceCents, product.currency)}
            </p>
          </div>
          <span className="sr-only">View {product.title}</span>
        </Link>
        <WishlistButton
          productId={product.id}
          className="absolute top-3 right-3 z-20 border-white/60 bg-white/80 shadow-sm backdrop-blur-md"
        />
      </article>
    </TiltCard>
  );
}
