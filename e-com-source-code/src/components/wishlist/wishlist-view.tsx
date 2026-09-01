"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LordIcon } from "@/components/icons/lord-icon";
import { LORDICON_COLORS } from "@/icons/lordicon";
import heartIcon from "@/icons/lordicon/heart.json";
import { ProductTile } from "@/components/product/product-tile";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export function WishlistView() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const { ids, hydrated } = useWishlist();
  const products = trpc.product.byIds.useQuery(
    { ids },
    { enabled: hydrated && ids.length > 0 }
  );

  if (!hydrated || (ids.length > 0 && !products.data)) {
    return <p className="text-sm text-muted-foreground">{t("wishlist.loading")}</p>;
  }

  if (ids.length === 0) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card px-6 py-16 text-center"
      >
        <LordIcon
          icon={heartIcon}
          size={80}
          className="mx-auto"
          trigger="once"
          state="in-heart"
          colors={LORDICON_COLORS.brand}
        />
        <h2 className="font-display mt-4 text-2xl">{t("wishlist.keepClose")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {t("wishlist.keepHint")}
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/catalog" />}>
          {t("wishlist.browse")}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout={!reduceMotion}
      className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.data?.map((product) => (
        <motion.div layout={!reduceMotion} key={product.id}>
          <ProductTile product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
}
