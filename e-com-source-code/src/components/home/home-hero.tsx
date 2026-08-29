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
import { Pressable } from "@/components/motion/pressable";
import type { ProductTileData } from "@/components/product/product-tile";
import OrbitImages from "@/components/reactbits/OrbitImages";
import { formatMoney } from "@/lib/money";
import { MOTION_DURATION, PREMIUM_EASE } from "@/lib/motion";
import type { StorefrontConfig } from "@/lib/storefront-config";
import HeroImage from "@/components/reactbits/HeroImage";

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
  const visualImages = Array.from(
    new Set([
      ...(heroImage ? [heroImage] : []),
      ...(product?.images ?? []),
    ]),
  );
  const orbitImages =
    visualImages.length > 0
      ? Array.from(
          { length: Math.max(5, visualImages.length) },
          (_, index) => visualImages[index % visualImages.length],
        ).slice(0, 6)
      : [];
    const images = [
        "https://picsum.photos/300/300?grayscale&random=1",
        "https://picsum.photos/300/300?grayscale&random=2",
        "https://picsum.photos/300/300?grayscale&random=3",
        "https://picsum.photos/300/300?grayscale&random=4",
        "https://picsum.photos/300/300?grayscale&random=5",
        "https://picsum.photos/300/300?grayscale&random=6",
    ];
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
        <motion.div
          style={{ y: imageY }}
          data-testid="hero-orbit"
          className="relative w-full max-w-none justify-self-center lg:w-[40rem] lg:justify-self-end"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: MOTION_DURATION.slow,
            delay: 0.14,
            ease: PREMIUM_EASE,
          }}
        >
          <HeroImage
            images={images}
            shape="square"
            radiusX={560}
            radiusY={300}
            rotation={-8}
            duration={100}
            itemSize={225}
            responsive={true}
            radius={540}
            direction="normal"
            fill
            showPath
            paused={false}
          />
          {/* {!customImage && product ? (
            <Link
              href={`/products/${product.slug}`}
              className="mx-auto -mt-8 flex max-w-md items-start justify-between gap-4 rounded-xl border border-border/80 bg-background/90 px-4 py-3 shadow-sm backdrop-blur-md transition-colors hover:border-brass/45"
            >
              <div>
                <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  {product.brand}
                </p>
                <p className="font-display mt-1 text-lg">{product.title}</p>
              </div>
              <p className="font-tabular text-sm">
                {formatMoney(product.minPriceCents, product.currency)}
              </p>
            </Link>
          ) : (
            <Link
              href={content.primaryHref}
              className="mx-auto -mt-8 block w-fit rounded-full border border-border/80 bg-background/90 px-4 py-2 text-sm shadow-sm backdrop-blur-md transition-colors hover:border-brass/45"
            >
              {content.primaryLabel}
            </Link>
          )} */}
        </motion.div>
      ) : null}
    </section>
  );
}
