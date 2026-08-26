"use client";

import { useRouter } from "next/navigation";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { OrderActions } from "@/components/admin/order-actions";

type OrderRow = {
  id: string;
  status: string;
  slipUncertain: boolean;
  totalCents: number;
  promptpayRef: string;
  createdAt: Date;
  user: { email: string };
  items: { quantity: number }[];
};

export function OrdersQueue({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-border text-xs tracking-[0.12em] text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Items</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              tabIndex={0}
              role="link"
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter") router.push(`/admin/orders/${order.id}`);
              }}
              className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
            >
              <td className="font-tabular px-4 py-4">{order.promptpayRef}</td>
              <td className="px-4 py-4 text-muted-foreground">{order.user.email}</td>
              <td className="font-tabular px-4 py-4 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(new Date(order.createdAt))}
              </td>
              <td className="font-tabular px-4 py-4 text-right">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
              <td className="font-tabular px-4 py-4 text-right text-brass">
                {formatMoney(order.totalCents)}
              </td>
              <td className="px-4 py-4">
                <StatusChip
                  tone={
                    order.status === "CANCELLED" || order.status === "REFUNDED"
                      ? "brick"
                      : order.status === "PENDING"
                        ? "brass"
                        : "forest"
                  }
                >
                  {order.slipUncertain && order.status === "PENDING"
                    ? "needs review"
                    : order.status.toLowerCase()}
                </StatusChip>
              </td>
              <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                <OrderActions order={order} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
