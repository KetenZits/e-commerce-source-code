import { InventoryMovements } from "@/components/admin/inventory-movements";
import { InventoryTable } from "@/components/admin/inventory-table";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { serverCaller } from "@/trpc/server";

export default async function InventoryPage() {
  const caller = await serverCaller();
  const [rows, movements, storefront] = await Promise.all([
    caller.admin.inventory(),
    caller.admin.inventoryMovements(),
    getStorefrontConfig(),
  ]);
  const low = rows.filter((row) => row.low).length;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} variant{rows.length === 1 ? "" : "s"}
          {" · "}
          {low} at or below the low-
          {storefront.storeMode === "digital" ? "availability" : "stock"} threshold.
        </p>
      </div>
      <InventoryTable rows={rows} storeMode={storefront.storeMode} />
      <section className="space-y-3">
        <h2 className="font-display text-xl">Stock history</h2>
        <InventoryMovements rows={movements} />
      </section>
    </div>
  );
}
