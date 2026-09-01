"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LordIcon } from "@/components/icons/lord-icon";
import { LORDICON_COLORS } from "@/icons/lordicon";
import bagIcon from "@/icons/lordicon/bag.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/components/i18n/locale-provider";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/client";

export function CartButton() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
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
              : line,
          )
          .filter((line) => line.quantity > 0);
        return {
          ...current,
          lines,
          subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
          weightGrams: lines.reduce((sum, line) => sum + line.weightGrams * line.quantity, 0),
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
  const count = cart.data?.count ?? 0;
  const lines = cart.data?.lines ?? [];
  const checkoutBlocked = lines.some((line) => line.stockQty < 1);
  const [iconPlay, setIconPlay] = useState(0);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onMouseEnter={() => setIconPlay((n) => n + 1)}
          />
        }
      >
        <LordIcon
          icon={bagIcon}
          size={18}
          trigger="manual"
          colorize="currentColor"
          playKey={`${count}:${iconPlay}`}
        />
        <span className="sr-only">{t("cart.open")}</span>
        {count > 0 ? (
          <span className="font-tabular absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {count}
          </span>
        ) : null}
      </DialogTrigger>
      <DialogContent className="fixed top-0 right-0 left-auto flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 flex-col rounded-none border-y-0 border-l border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t("cart.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("cart.itemsInBag")}</DialogDescription>
        </DialogHeader>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
            <LordIcon
              icon={bagIcon}
              size={72}
              trigger="once"
              state="in-reveal"
              colors={LORDICON_COLORS.brand}
            />
            <p className="mt-3 text-sm text-muted-foreground">{t("cart.empty")}</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {lines.map((line) => (
                <div key={line.id} className="flex gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {line.product.image ? (
                      <Image src={line.product.image} alt={line.product.title} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm">{line.product.title}</p>
                      <p className="font-tabular shrink-0 text-sm">{formatMoney(line.lineTotalCents)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {line.attributeLabel} × {line.quantity}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("cart.decrease")}
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({ id: line.id, quantity: Math.max(0, line.quantity - 1) })
                          }
                        >
                          <Minus />
                        </Button>
                        <span className="font-tabular min-w-7 text-center text-xs">{line.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("cart.increase")}
                          disabled={update.isPending || line.quantity >= line.stockQty}
                          onClick={() => update.mutate({ id: line.id, quantity: line.quantity + 1 })}
                        >
                          <Plus />
                        </Button>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-destructive"
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: line.id, quantity: 0 })}
                      >
                        <Trash2 className="size-3.5" />
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span>{t("cart.subtotal")}</span>
                <span className="font-tabular">{formatMoney(cart.data?.subtotalCents ?? 0)}</span>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" nativeButton={false} render={<Link href="/cart" />}>
                  {t("cart.viewCart")}
                </Button>
                {checkoutBlocked ? (
                  <Button className="flex-1" disabled>{t("cart.outOfStock")}</Button>
                ) : (
                  <Button className="flex-1" nativeButton={false} render={<Link href="/checkout" />}>
                    {t("cart.checkout")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
