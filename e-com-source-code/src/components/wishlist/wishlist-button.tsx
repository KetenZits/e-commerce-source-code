"use client";

import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { useI18n } from "@/components/i18n/locale-provider";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { t } = useI18n();
  const { isLiked, toggle } = useWishlist();
  const reduceMotion = useReducedMotion();
  const liked = isLiked(productId);

  return (
    <motion.button
      type="button"
      aria-label={liked ? t("wishlist.remove") : t("wishlist.add")}
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
        "inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/25 hover:bg-card",
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
