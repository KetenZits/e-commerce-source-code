"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatAttributes, asAttributes } from "@/lib/product";
import { trpc } from "@/trpc/client";

type Variant = {
  id: string;
  sku: string;
  attributes: unknown;
  priceCents: number;
  stockQty: number;
};

export function AddToCart({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const reduceMotion = useReducedMotion();
  const [added, setAdded] = useState(false);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const selected = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const add = trpc.cart.add.useMutation({
    onSuccess: async () => {
      setAdded(true);
      toast.message("Added to cart");
      await utils.cart.get.invalidate();
      router.refresh();
      window.setTimeout(() => setAdded(false), 1200);
    },
    onError: (error) => toast.error(error.message),
  });

  const options = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: formatAttributes(variant.attributes) || variant.sku,
        stockQty: variant.stockQty,
      })),
    [variants]
  );

  if (!selected) return null;
  const out = selected.stockQty < 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setVariantId(option.id)}
            className={`rounded-md border px-3 py-2 text-sm ${
              option.id === selected.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            } ${option.stockQty < 1 ? "opacity-40" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <motion.div whileTap={reduceMotion || out ? undefined : { scale: 0.98 }}>
        <Button
          className="w-full justify-between px-4"
          size="lg"
          disabled={out || add.isPending}
          onClick={() => add.mutate({ productVariantId: selected.id, quantity: 1 })}
        >
          <span>{out ? "Out of stock" : add.isPending ? "Adding" : added ? "Added" : "Add to cart"}</span>
          <motion.span
            animate={added && !reduceMotion ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            className="inline-flex size-7 items-center justify-center rounded-full border border-primary-foreground/30"
          >
            {added ? <Check className="size-3.5" /> : <ShoppingBag className="size-3.5" />}
          </motion.span>
        </Button>
      </motion.div>
      <p className="font-tabular text-xs text-muted-foreground">
        {asAttributes(selected.attributes).color ? `SKU ${selected.sku}` : selected.sku}
        {out ? "" : ` · ${selected.stockQty} in stock`}
      </p>
    </div>
  );
}
