import { OrdersExportButton } from "@/components/admin/csv-export";
import { OrdersQueue } from "@/components/admin/orders-queue";
import { serverCaller } from "@/trpc/server";

export default async function AdminOrdersPage() {
  const orders = await (await serverCaller()).admin.orders();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Orders</h1>
          <p className="text-sm text-muted-foreground">Pending payments first, then fulfillment.</p>
        </div>
        <OrdersExportButton />
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <OrdersQueue orders={orders} />
      )}
    </div>
  );
}
