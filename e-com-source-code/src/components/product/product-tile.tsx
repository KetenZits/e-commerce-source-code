"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export type ProductTileData = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  images: string[];
  minPriceCents: number;
  currency: string;
  inStock: boolean;
  variantId?: string;
  basePriceCents?: number;
  createdAt?: Date | string;
  category?: { name: string };
  isNew?: boolean;
  isBestSeller?: boolean;
};

export function ProductTile({
  product,
  className,
  priority = false,
  layout = "grid",
}: {
  product: ProductTileData;
  className?: string;
  priority?: boolean;
  layout?: "grid" | "list";
}) {
  const [hovered, setHovered] = useState(false);
  const { t } = useI18n();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const utils = trpc.useUtils();
  const add = trpc.cart.add.useMutation({
    onSuccess: async () => {
      toast.message(t("addToCart.added"));
      await utils.cart.get.invalidate();
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const primaryImage = product.images[0];
  const alternateImage = product.images[1];
  const showAlternate = Boolean(alternateImage && hovered && !reduceMotion);
  const compareAt = product.basePriceCents ?? 0;
  const onSale = compareAt > product.minPriceCents;
  const salePercent = onSale
    ? Math.round((1 - product.minPriceCents / compareAt) * 100)
    : 0;

  function addProduct() {
    if (!product.variantId || !product.inStock) {
      router.push(`/products/${product.slug}`);
      return;
    }
    add.mutate({ productVariantId: product.variantId, quantity: 1 });
  }

  const image = (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/40",
        layout === "list"
          ? "aspect-4/5 w-32 shrink-0 sm:w-40"
          : "aspect-4/5 w-full",
      )}
    >
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
              sizes={
                layout === "list"
                  ? "160px"
                  : "(min-width: 1280px) 18vw, (min-width: 640px) 40vw, 100vw"
              }
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
                sizes={
                  layout === "list"
                    ? "160px"
                    : "(min-width: 1280px) 18vw, (min-width: 640px) 40vw, 100vw"
                }
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
      <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
        {product.isBestSeller ? (
          <span className="rounded-md bg-brass px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] text-white uppercase">
            {t("home.bestSeller")}
          </span>
        ) : null}
        {product.isNew ? (
          <span className="rounded-md bg-[#e8c547] px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] text-white uppercase">
            {t("catalog.new")}
          </span>
        ) : null}
      </div>
      {onSale && salePercent > 0 ? (
        <span className="absolute bottom-3 left-3 z-10 rounded-md bg-[#f4d4d0] px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] text-[#8a4a42] uppercase">
          {t("catalog.sale", { percent: salePercent })}
        </span>
      ) : null}
      {!product.inStock ? (
        <div className="absolute inset-0 z-10 bg-background/35">
          <span className="absolute bottom-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase shadow-sm backdrop-blur-sm">
            {t("product.outOfStock")}
          </span>
        </div>
      ) : null}
      <WishlistButton
        productId={product.id}
        className="absolute top-3 right-3 z-20 border-white/70 bg-white/90 shadow-sm"
      />
    </div>
  );

  const details = (
    <>
      <p className="eyebrow truncate">{product.brand}</p>
      <h3 className="font-display mt-1 line-clamp-2 text-[1.05rem] leading-snug">
        {product.title}
      </h3>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-sm text-foreground">
          {formatMoney(product.minPriceCents, product.currency)}
        </p>
        {onSale ? (
          <p className="text-xs text-muted-foreground line-through">
            {formatMoney(compareAt, product.currency)}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(34,33,30,0.04)]",
        layout === "list" ? "flex items-stretch" : "flex h-full flex-col",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/products/${product.slug}`}
        aria-label={product.title}
        className={cn(
          "min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          layout === "list" ? "flex min-w-0 flex-1 items-stretch" : "flex flex-1 flex-col",
        )}
      >
        {image}
        <div
          className={cn(
            "min-w-0",
            layout === "list" ? "flex flex-1 flex-col justify-center px-5 py-4 pr-14" : "px-4 pt-3.5 pr-12 pb-4",
          )}
        >
          {details}
        </div>
      </Link>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={t("addToCart.add")}
        disabled={add.isPending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          addProduct();
        }}
        className="absolute right-3 bottom-3.5 size-8 rounded-full border-primary/30 bg-transparent shadow-none"
      >
        <Plus className="size-3.5" />
      </Button>
    </article>
  );
}
