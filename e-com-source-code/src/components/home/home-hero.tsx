"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductTileData } from "@/components/product/product-tile";
import { formatMoney } from "@/lib/money";

export function HomeHero({ product }: { product?: ProductTileData }) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -32]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduceMotion ? 1 : 0.25]);

  return (
    <section
      ref={ref}
      className="relative grid min-h-[calc(100svh-4rem)] items-center gap-10 overflow-hidden py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14"
    >
      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative z-10 max-w-xl space-y-6"
      >
        <motion.p
          className="eyebrow"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          Bangkok atelier
        </motion.p>
        <motion.h1
          className="font-display text-5xl leading-[1.05] sm:text-6xl"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          Goods made to be used, not displayed.
        </motion.h1>
        <motion.p
          className="max-w-lg text-muted-foreground leading-7"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
        >
          A small catalog of apparel, tableware, and leather — photographed as
          they are, priced in Thai baht, shipped from Bangkok.
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          <Button nativeButton={false} render={<Link href="/catalog" />}>
            Shop the catalog
            <ArrowRight />
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/#featured" />}>
            View featured
          </Button>
        </motion.div>
      </motion.div>

      {product?.images[0] ? (
        <motion.div style={{ y: imageY }} className="relative lg:justify-self-end">
          <Link href={`/products/${product.slug}`} className="group block">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-card sm:w-[30rem] lg:w-[32rem]"
            >
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 32rem, 90vw"
              />
            </motion.div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  {product.brand}
                </p>
                <p className="font-display mt-1 text-lg">{product.title}</p>
              </div>
              <p className="font-tabular text-sm">
                {formatMoney(product.minPriceCents, product.currency)}
              </p>
            </div>
          </Link>
        </motion.div>
      ) : null}
    </section>
  );
}
