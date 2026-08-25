"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/client";

export function CartButton() {
  const cart = trpc.cart.get.useQuery();
  const count = cart.data?.count ?? 0;
  const lines = cart.data?.lines ?? [];

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="relative" />}>
        <ShoppingBag className="size-4" />
        <span className="sr-only">Cart</span>
        {count > 0 ? (
          <span className="font-tabular absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {count}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogContent className="fixed top-0 right-0 left-auto h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 rounded-none border-y-0 border-l border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Cart</DialogTitle>
          <DialogDescription className="sr-only">Items in your bag</DialogDescription>
        </DialogHeader>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {lines.map((line) => (
              <div key={line.id} className="flex gap-3">
                <div className="relative size-16 overflow-hidden rounded-xl bg-muted">
                  {line.product.image ? (
                    <Image src={line.product.image} alt={line.product.title} fill className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{line.product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.attributeLabel} × {line.quantity}
                  </p>
                </div>
                <p className="font-tabular text-sm">{formatMoney(line.lineTotalCents)}</p>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-tabular">{formatMoney(cart.data?.subtotalCents ?? 0)}</span>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" nativeButton={false} render={<Link href="/cart" />}>
                View cart
              </Button>
              <Button className="flex-1" nativeButton={false} render={<Link href="/checkout" />}>
                Checkout
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
