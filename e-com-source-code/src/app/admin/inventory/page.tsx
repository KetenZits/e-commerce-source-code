import { InventoryTable } from "@/components/admin/inventory-table";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { serverCaller } from "@/trpc/server";

export default async function InventoryPage() {
  const [rows, storefront] = await Promise.all([
    (await serverCaller()).admin.inventory(),
    getStorefrontConfig(),
  ]);
  const low = rows.filter((row) => row.low).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          {low} variant(s) at or below the low-
          {storefront.storeMode === "digital" ? "availability" : "stock"} threshold.
        </p>
      </div>
      <InventoryTable rows={rows} storeMode={storefront.storeMode} />
    </div>
  );
}
