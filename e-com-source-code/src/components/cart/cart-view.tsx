"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/section-divider";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/client";

export function CartView() {
  const utils = trpc.useUtils();
  const cart = trpc.cart.get.useQuery();
  const update = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  if (!cart.data) return <p className="text-sm text-muted-foreground">Loading cart…</p>;
  if (cart.data.lines.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-4" nativeButton={false} render={<Link href="/catalog" />}>
          Continue shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        {cart.data.lines.map((line) => (
          <div key={line.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <div className="relative size-24 overflow-hidden rounded-xl bg-muted">
              {line.product.image ? (
                <Image src={line.product.image} alt={line.product.title} fill className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">{line.product.brand}</p>
              <Link href={`/products/${line.product.slug}`} className="font-display text-lg">
                {line.product.title}
              </Link>
              <p className="text-sm text-muted-foreground">{line.attributeLabel}</p>
              <div className="mt-2 flex items-center gap-2">
                <select
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                  value={line.quantity}
                  onChange={(event) => update.mutate({ id: line.id, quantity: Number(event.target.value) })}
                >
                  {Array.from({ length: Math.min(10, Math.max(line.stockQty, line.quantity)) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="button" className="text-sm text-destructive" onClick={() => update.mutate({ id: line.id, quantity: 0 })}>
                  Remove
                </button>
              </div>
            </div>
            <p className="font-tabular text-right text-sm text-brass">{formatMoney(line.lineTotalCents)}</p>
          </div>
        ))}
      </div>
      <aside className="h-fit rounded-xl border border-border bg-card p-5">
        <p className="eyebrow mb-3">Summary</p>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-tabular">{formatMoney(cart.data.subtotalCents)}</span>
        </div>
        <SectionDivider className="my-4" />
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
