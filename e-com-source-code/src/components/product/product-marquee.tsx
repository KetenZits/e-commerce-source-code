"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProductTileData } from "@/components/product/product-tile";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function ProductMarquee({
  products,
  className,
  eyebrow,
  title,
  description,
  cta,
  highlightId,
  headingId = "product-marquee",
}: {
  products: ProductTileData[];
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  cta?: { href: string; label: string };
  highlightId?: string;
  headingId?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const utils = trpc.useUtils();
  const add = trpc.cart.add.useMutation({
    onSuccess: async () => {
      toast.message(t("addToCart.added"));
      await utils.cart.get.invalidate();
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const items = products.filter((product) => product.images[0]).slice(0, 8);

  const addProduct = (product: ProductTileData) => {
    if (!product.variantId || !product.inStock) {
      router.push(`/products/${product.slug}`);
      return;
    }
    add.mutate({ productVariantId: product.variantId, quantity: 1 });
  };

  if (items.length < 2) return null;

  return (
    <div
      className={cn("product-marquee space-y-8", className)}
      data-motion="marquee"
    >
      {title ? (
        <Reveal>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              <h2
                id={headingId}
                className="font-display mt-2 text-3xl leading-tight md:text-4xl"
              >
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {cta ? (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/25 px-4 py-2 text-sm transition-colors hover:bg-card"
              >
                {cta.label}
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      <div className="rounded-[1.75rem] bg-[#f8f6f1] px-3 py-6 md:rounded-[2.25rem] md:px-5 md:py-8">
        <div
          className="product-marquee-viewport overflow-hidden"
          aria-label={title ?? t("home.across")}
        >
          <div className="product-marquee-track">
            <div className="product-marquee-set">
              {items.map((product) => (
                <MarqueeCard
                  key={product.id}
                  product={product}
                  highlight={product.id === highlightId}
                  highlightLabel={t("home.bestSeller")}
                  addLabel={t("addToCart.add")}
                  adding={add.isPending}
                  onAdd={() => addProduct(product)}
                />
              ))}
            </div>
            <div className="product-marquee-set" aria-hidden>
              {items.map((product) => (
                <MarqueeCard
                  key={`clone-${product.id}`}
                  product={product}
                  clone
                  highlight={product.id === highlightId}
                  highlightLabel={t("home.bestSeller")}
                  addLabel={t("addToCart.add")}
                  adding={add.isPending}
                  onAdd={() => addProduct(product)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeCard({
  product,
  clone = false,
  highlight,
  highlightLabel,
  addLabel,
  adding,
  onAdd,
}: {
  product: ProductTileData;
  clone?: boolean;
  highlight: boolean;
  highlightLabel: string;
  addLabel: string;
  adding: boolean;
  onAdd: () => void;
}) {
  return (
    <article
      data-marquee-card
      className="group relative w-[min(78%,16.5rem)] shrink-0 sm:w-61 lg:w-63"
      aria-hidden={clone || undefined}
      inert={clone}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(34,33,30,0.04)]">
        <Link
          href={`/products/${product.slug}`}
          tabIndex={clone ? -1 : undefined}
          className="flex flex-1 flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <div className="relative aspect-4/5 overflow-hidden bg-muted/40">
            <Image
              src={product.images[0]}
              alt={clone ? "" : product.title}
              fill
              loading="lazy"
              sizes="280px"
              className="object-cover transition-transform duration-700 ease-(--motion-premium) group-hover:scale-[1.045]"
            />
            {highlight ? (
              <span className="absolute top-3 left-3 rounded-full bg-[#e4c04a] px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] text-white uppercase ring-1 ring-white/80">
                {highlightLabel}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 px-4 pt-3.5 pr-12 pb-4">
            <p className="eyebrow truncate">{product.brand}</p>
            <p className="font-display mt-1 line-clamp-2 text-[1.05rem] leading-snug">
              {product.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatMoney(product.minPriceCents, product.currency)}
            </p>
          </div>
        </Link>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          tabIndex={clone ? -1 : undefined}
          aria-label={addLabel}
          disabled={adding}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAdd();
          }}
          className="absolute right-3 bottom-3.5 size-8 rounded-full border-primary/30 bg-transparent shadow-none"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}
