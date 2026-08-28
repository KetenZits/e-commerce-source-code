"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/section-divider";
import { formatMoney } from "@/lib/money";
import type { StoreMode } from "@/lib/storefront-config";
import { trpc } from "@/trpc/client";

export function CartView({ storeMode }: { storeMode: StoreMode }) {
  const utils = trpc.useUtils();
  const reduceMotion = useReducedMotion();
  const cart = trpc.cart.get.useQuery();
  const update = trpc.cart.update.useMutation({
    onMutate: async (input) => {
      await utils.cart.get.cancel();
      const previous = utils.cart.get.getData();
      utils.cart.get.setData(undefined, (current) => {
        if (!current) return current;
        const lines = current.lines
          .map((line) =>
            line.id === input.id
              ? {
                  ...line,
                  quantity: input.quantity,
                  lineTotalCents: line.priceCents * input.quantity,
                }
              : line
          )
          .filter((line) => line.quantity > 0);
        return {
          ...current,
          lines,
          subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
          weightGrams: lines.reduce(
            (sum, line) => sum + line.weightGrams * line.quantity,
            0
          ),
          count: lines.reduce((sum, line) => sum + line.quantity, 0),
        };
      });
      return { previous };
    },
    onError: (error, _input, context) => {
      utils.cart.get.setData(undefined, context?.previous);
      toast.error(error.message);
    },
    onSettled: () => utils.cart.get.invalidate(),
  });

  if (!cart.data) {
    return <div className="h-64 rounded-xl border border-border bg-card" />;
  }
  if (cart.data.lines.length === 0) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card px-6 py-16 text-center"
      >
        <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
        <h2 className="font-display mt-4 text-2xl">Your bag is waiting.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Add a considered piece from the catalog and it will appear here.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/catalog" />}>
          Continue shopping
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <AnimatePresence initial={false} mode="popLayout">
          {cart.data.lines.map((line) => (
            <motion.article
              layout
              key={line.id}
              initial={reduceMotion ? false : { opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 0.28 }}
              className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-border py-5 first:pt-0 sm:grid-cols-[112px_minmax(0,1fr)_auto]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                {line.product.image ? (
                  <Image
                    src={line.product.image}
                    alt={line.product.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="eyebrow">{line.product.brand}</p>
                <Link
                  href={`/products/${line.product.slug}`}
                  className="font-display mt-1 block text-lg"
                >
                  {line.product.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{line.attributeLabel}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-lg border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Decrease quantity"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({ id: line.id, quantity: Math.max(0, line.quantity - 1) })
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="font-tabular min-w-8 text-center text-sm">{line.quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Increase quantity"
                      disabled={update.isPending || line.quantity >= line.stockQty}
                      onClick={() =>
                        update.mutate({ id: line.id, quantity: line.quantity + 1 })
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-destructive"
                    onClick={() => update.mutate({ id: line.id, quantity: 0 })}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-tabular col-start-2 text-right text-sm text-brass sm:col-start-3 sm:row-start-1">
                {formatMoney(line.lineTotalCents)}
              </p>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
        <p className="eyebrow mb-3">Summary</p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-tabular">{formatMoney(cart.data.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{storeMode === "digital" ? "Digital delivery" : "Shipping"}</span>
            <span>
              {storeMode === "digital" ? "No delivery fee" : "Calculated at checkout"}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="font-tabular">{formatMoney(0)}</span>
          </div>
        </div>
        <SectionDivider className="my-4" />
        <div className="mb-5 flex justify-between">
          <span>Total</span>
          <span className="font-tabular text-brass">{formatMoney(cart.data.subtotalCents)}</span>
        </div>
        {cart.data.lines.some((line) => line.stockQty < 1) ? (
          <p className="mb-3 text-sm text-destructive">Remove out-of-stock items before checkout.</p>
        ) : null}
        {cart.data.lines.some((line) => line.stockQty < 1) ? (
          <Button className="w-full" disabled>
            Checkout
          </Button>
        ) : (
          <Button className="w-full" nativeButton={false} render={<Link href="/checkout" />}>
            Checkout
          </Button>
        )}
      </aside>
    </div>
  );
}
