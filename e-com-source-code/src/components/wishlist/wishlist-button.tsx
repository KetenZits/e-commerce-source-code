"use client";

import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/components/wishlist/wishlist-provider";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { isLiked, toggle } = useWishlist();
  const reduceMotion = useReducedMotion();
  const liked = isLiked(productId);

  return (
    <motion.button
      type="button"
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={liked}
      whileTap={reduceMotion ? undefined : { scale: 0.78 }}
      animate={reduceMotion ? undefined : { scale: liked ? [1, 1.24, 1] : 1 }}
      transition={{ duration: 0.28 }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          liked && "fill-destructive text-destructive"
        )}
      />
    </motion.button>
  );
}
