"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { TiltCard } from "@/components/motion/tilt-card";
import { cn } from "@/lib/utils";
import { MOTION_DURATION, PREMIUM_EASE } from "@/lib/motion";

export function ProductGallery({
  productId,
  title,
  images,
}: {
  productId: string;
  title: string;
  images: string[];
}) {
  const [selected, setSelected] = useState(0);
  const reduceMotion = useReducedMotion();
  const active = images[selected] ?? images[0];

  return (
    <div className="space-y-3">
      <TiltCard intensity={3}>
      <div className="premium-depth relative aspect-4/5 overflow-hidden rounded-xl border border-foreground/15 bg-card">
        <AnimatePresence mode="wait" initial={false}>
          {active ? (
            <motion.div
              key={active}
              className="absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.992 }}
              transition={{
                duration: reduceMotion ? 0 : MOTION_DURATION.medium,
                ease: PREMIUM_EASE,
              }}
            >
              <Image
                src={active}
                alt={`${title}, view ${selected + 1}`}
                fill
                priority={selected === 0}
                className="object-cover"
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <WishlistButton productId={productId} className="absolute top-4 right-4 z-20" />
      </div>
      </TiltCard>
      {images.length > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Product images"
        >
          {images.map((src, index) => (
            <motion.button
              type="button"
              key={src}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={selected === index}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => setSelected(index)}
              className={cn(
                "relative aspect-square w-[18%] min-w-16 overflow-hidden rounded-lg border bg-card",
                selected === index ? "border-foreground" : "border-border"
              )}
            >
              {selected === index ? (
                <motion.span
                  layoutId="active-gallery-image"
                  className="absolute inset-0 z-10 rounded-lg ring-1 ring-foreground"
                  transition={{ duration: reduceMotion ? 0 : MOTION_DURATION.fast }}
                />
              ) : null}
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </motion.button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
