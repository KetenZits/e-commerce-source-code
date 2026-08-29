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
    reservedQty?: number;
    availableQty?: number;
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

  const importCodes = trpc.admin.importDigitalCodes.useMutation({
    onSuccess: (result) => {
      toast.message(`Imported ${result.count} code(s)`);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
    <div className="space-y-2">
      {rows.map((row) => (
        <form
          key={row.id}
          className={`flex flex-wrap items-center gap-3 rounded-xl border bg-card px-3 py-3 ${row.low ? "border-destructive/40" : "border-border"}`}
          onSubmit={(event) => {
            event.preventDefault();
            const qty = Number(new FormData(event.currentTarget).get("qty"));
            adjust.mutate({ variantId: row.id, stockQty: qty, reason: "Manual adjustment" });
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm">{row.product.title}</p>
            <p className="font-tabular text-xs text-muted-foreground">
              {row.sku}
              {row.reservedQty ? ` · reserved ${row.reservedQty}` : ""}
            </p>
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
        <select name="variantId" className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" required>
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
