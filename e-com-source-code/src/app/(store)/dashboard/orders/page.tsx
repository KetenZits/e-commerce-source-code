import Link from "next/link";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { serverCaller } from "@/trpc/server";

const tone: Record<string, "muted" | "brass" | "forest" | "brick"> = {
  PENDING: "brass",
  PAID: "forest",
  PACKED: "forest",
  SHIPPED: "forest",
  DELIVERED: "forest",
  CANCELLED: "brick",
  REFUNDED: "brick",
};

export default async function OrdersPage() {
  const orders = await (await serverCaller()).order.mine();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Orders</h1>
      {orders.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
          No orders yet.{" "}
          <Link href="/catalog" className="text-primary">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={order.status === "PENDING" ? `/checkout/${order.id}` : `/orders/${order.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-4"
            >
              <div>
                <p className="font-tabular text-sm">{order.promptpayRef}</p>
                <p className="text-sm text-muted-foreground">
                  {order.items.length} item(s) ·{" "}
                  {order.fulfillmentType === "DIGITAL"
                    ? order.status === "DELIVERED"
                      ? "access ready"
                      : "digital delivery"
                    : order.estimatedDelivery ?? "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-tabular text-brass">{formatMoney(order.totalCents)}</p>
                <StatusChip tone={tone[order.status] ?? "muted"}>{order.status.toLowerCase()}</StatusChip>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
