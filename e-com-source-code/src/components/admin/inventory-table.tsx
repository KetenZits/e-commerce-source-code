"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import type { StoreMode } from "@/lib/storefront-config";

export function InventoryTable({
  rows,
  storeMode,
}: {
  storeMode: StoreMode;
  rows: {
    id: string;
    sku: string;
    stockQty: number;
    low: boolean;
    product: { title: string };
  }[];
}) {
  const router = useRouter();
  const adjust = trpc.admin.adjustStock.useMutation({
    onSuccess: () => {
      toast.message("Stock updated");
      router.refresh();
    },
  });

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <form
          key={row.id}
          className={`flex flex-wrap items-center gap-3 rounded-xl border bg-card px-3 py-3 ${row.low ? "border-destructive/40" : "border-border"}`}
          onSubmit={(event) => {
            event.preventDefault();
            const qty = Number(new FormData(event.currentTarget).get("qty"));
            adjust.mutate({ variantId: row.id, stockQty: qty });
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm">{row.product.title}</p>
            <p className="font-tabular text-xs text-muted-foreground">{row.sku}</p>
          </div>
          {row.low ? (
            <span className="text-xs text-destructive">
              Low {storeMode === "digital" ? "availability" : "stock"}
            </span>
          ) : null}
          <Input name="qty" type="number" defaultValue={row.stockQty} className="font-tabular w-20" />
          <Button size="sm" type="submit">
            Save
          </Button>
        </form>
      ))}
    </div>
  );
}
