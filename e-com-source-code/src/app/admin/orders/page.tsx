import { OrdersQueue } from "@/components/admin/orders-queue";
import { serverCaller } from "@/trpc/server";

export default async function AdminOrdersPage() {
  const orders = await (await serverCaller()).admin.orders();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">Pending manual-verification payments stay at the top.</p>
      </div>
      {orders.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <OrdersQueue orders={orders} />
      )}
    </div>
  );
}
