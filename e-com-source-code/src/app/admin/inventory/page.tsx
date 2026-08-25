import { InventoryTable } from "@/components/admin/inventory-table";
import { serverCaller } from "@/trpc/server";

export default async function InventoryPage() {
  const rows = await (await serverCaller()).admin.inventory();
  const low = rows.filter((row) => row.low).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="text-sm text-muted-foreground">{low} variant(s) at or below the low-stock threshold.</p>
      </div>
      <InventoryTable rows={rows} />
    </div>
  );
}
