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
import {
  ParallaxPlane,
  ParallaxScene,
} from "@/components/motion/parallax-scene";
import { Pressable } from "@/components/motion/pressable";
import type { ProductTileData } from "@/components/product/product-tile";
import { formatMoney } from "@/lib/money";
import { MOTION_DURATION, PREMIUM_EASE } from "@/lib/motion";
import type { StorefrontConfig } from "@/lib/storefront-config";

export function HomeHero({
  product,
  content,
}: {
  product?: ProductTileData;
  content: StorefrontConfig["hero"];
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 90]);
  const backdropY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduceMotion ? 0 : 150],
  );
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -32]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduceMotion ? 1 : 0.25]);
  const heroImage = content.imageUrl || product?.images[0];
  const customImage = Boolean(content.imageUrl);

  return (
    <section
      ref={ref}
      className="relative grid min-h-[calc(100svh-4rem)] items-center gap-10 overflow-hidden py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14"
    >
      <motion.div
        aria-hidden
        style={{ y: backdropY }}
        className="absolute -top-16 right-[4%] hidden size-128 rounded-full border border-primary/10 bg-primary/5 blur-2xl lg:block"
      />
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
          {content.eyebrow}
        </motion.p>
        <motion.h1
          className="font-display text-5xl leading-[1.05] sm:text-6xl"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: MOTION_DURATION.slow,
            delay: 0.08,
            ease: PREMIUM_EASE,
          }}
        >
          {content.title}
        </motion.h1>
        <motion.p
          className="max-w-lg text-muted-foreground leading-7"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
        >
          {content.body}
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          <Pressable>
            <Button nativeButton={false} render={<Link href={content.primaryHref} />}>
              {content.primaryLabel}
              <ArrowRight />
            </Button>
          </Pressable>
          <Pressable>
            <Button variant="outline" nativeButton={false} render={<Link href={content.secondaryHref} />}>
              {content.secondaryLabel}
            </Button>
          </Pressable>
        </motion.div>
      </motion.div>

      {heroImage ? (
        <motion.div style={{ y: imageY }} className="relative lg:justify-self-end">
          <ParallaxScene className="relative" intensity={5}>
            <ParallaxPlane
              depth={-28}
              className="absolute -inset-4 rounded-[1.25rem] border border-brass/20 bg-brass/8"
            >
              <span className="sr-only">Decorative depth layer</span>
            </ParallaxPlane>
            <ParallaxPlane depth={28}>
              <Link
                href={customImage ? content.primaryHref : `/products/${product?.slug}`}
                className="group block"
              >
                <div className="premium-depth relative aspect-4/5 w-full overflow-hidden rounded-xl border border-border bg-card sm:w-120 lg:w-lg">
                  <Image
                    src={heroImage}
                    alt={customImage ? content.title : (product?.title ?? content.title)}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    sizes="(min-width: 1024px) 32rem, 90vw"
                  />
                  <span className="absolute inset-0 bg-linear-to-t from-foreground/12 via-transparent to-transparent" />
                </div>
                {!customImage && product ? (
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
                ) : null}
              </Link>
            </ParallaxPlane>
          </ParallaxScene>
        </motion.div>
      ) : null}
    </section>
  );
}
