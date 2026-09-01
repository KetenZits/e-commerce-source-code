"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { formatAttributes, productImages } from "@/lib/product";
import type { StoreMode } from "@/lib/storefront-config";
import { trpc } from "@/trpc/client";

export type InventoryRow = {
  id: string;
  sku: string;
  stockQty: number;
  reservedQty?: number;
  availableQty?: number;
  low: boolean;
  imageUrl?: string | null;
  attributes?: unknown;
  product: {
    id: string;
    title: string;
    brand?: string;
    images?: unknown;
    fulfillmentType?: string;
  };
};

function coverFor(row: InventoryRow) {
  return row.imageUrl || productImages(row.product.images)[0];
}

export function InventoryTable({
  rows,
  storeMode,
}: {
  storeMode: StoreMode;
  rows: InventoryRow[];
}) {
  const router = useRouter();
  const adjust = trpc.admin.adjustStock.useMutation({
    onSuccess: () => {
      toast.message("Stock updated");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const importCodes = trpc.admin.importDigitalCodes.useMutation({
    onSuccess: (result) => {
      toast.message(`Imported ${result.count} code(s)`);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const groups = useMemo(() => {
    const next: { product: InventoryRow["product"]; image?: string; variants: InventoryRow[] }[] = [];
    const index = new Map<string, number>();
    for (const row of rows) {
      const key = row.product.id;
      const existing = index.get(key);
      if (existing == null) {
        index.set(key, next.length);
        next.push({ product: row.product, image: coverFor(row), variants: [row] });
      } else {
        next[existing].variants.push(row);
        if (!next[existing].image) next[existing].image = coverFor(row);
      }
    }
    return next;
  }, [rows]);

  if (!rows.length) {
    return (
      <p className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
        No variants yet. Add a product to manage stock here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {groups.map((group) => {
          const lowCount = group.variants.filter((variant) => variant.low).length;
          return (
            <article
              key={group.product.id}
              className={`overflow-hidden rounded-xl border bg-card ${
                lowCount ? "border-destructive/40" : "border-border"
              }`}
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <Link
                  href={`/admin/products/${group.product.id}`}
                  className="relative aspect-4/5 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-auto sm:h-36 sm:w-28"
                >
                  {group.image ? (
                    <Image
                      src={group.image}
                      alt={group.product.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                      No image
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {group.product.brand ? (
                        <p className="eyebrow">{group.product.brand}</p>
                      ) : null}
                      <Link
                        href={`/admin/products/${group.product.id}`}
                        className="font-display text-lg leading-tight hover:text-primary"
                      >
                        {group.product.title}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.product.fulfillmentType === "DIGITAL" ? (
                        <StatusChip tone="brass">digital</StatusChip>
                      ) : null}
                      {lowCount ? (
                        <StatusChip tone="brick">
                          {lowCount} low {storeMode === "digital" ? "availability" : "stock"}
                        </StatusChip>
                      ) : null}
                    </div>
                  </div>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {group.variants.map((row) => {
                      const available = row.availableQty ?? Math.max(0, row.stockQty - (row.reservedQty ?? 0));
                      const reserved = row.reservedQty ?? 0;
                      const label = formatAttributes(row.attributes);
                      return (
                        <form
                          key={row.id}
                          className="flex flex-wrap items-center gap-3 px-3 py-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const qty = Number(new FormData(event.currentTarget).get("qty"));
                            adjust.mutate({
                              variantId: row.id,
                              stockQty: qty,
                              reason: "Manual adjustment",
                            });
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{label || row.sku}</p>
                            <p className="font-tabular text-xs text-muted-foreground">
                              {row.sku}
                              {" · "}
                              <span className={available < 1 || row.low ? "text-destructive" : ""}>
                                {available} available
                              </span>
                              {reserved ? ` · ${reserved} reserved` : ""}
                            </p>
                          </div>
                          {row.low ? (
                            <StatusChip tone="brick">
                              Low {storeMode === "digital" ? "availability" : "stock"}
                            </StatusChip>
                          ) : null}
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            On hand
                            <Input
                              name="qty"
                              type="number"
                              min="0"
                              defaultValue={row.stockQty}
                              className="font-tabular w-20"
                            />
                          </label>
                          <Button size="sm" type="submit" disabled={adjust.isPending}>
                            Save
                          </Button>
                        </form>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <form
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          importCodes.mutate({
            variantId: String(data.get("variantId") ?? ""),
            codes: String(data.get("codes") ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          });
        }}
      >
        <p className="text-sm font-medium">Import digital codes</p>
        <select
          name="variantId"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          required
        >
          {rows.map((row) => (
            <option key={row.id} value={row.id}>
              {row.product.title} · {row.sku}
            </option>
          ))}
        </select>
        <textarea
          name="codes"
          rows={5}
          required
          placeholder={"One code per line"}
          className="w-full rounded-lg border border-input bg-transparent p-2 font-mono text-xs"
        />
        <Button size="sm" type="submit" disabled={importCodes.isPending}>
          Import codes
        </Button>
      </form>
    </div>
  );
}
