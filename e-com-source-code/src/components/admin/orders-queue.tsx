"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { formatAttributes } from "@/lib/product";
import { trpc } from "@/trpc/client";

type OrderRow = {
  id: string;
  status: string;
  slipUncertain: boolean;
  totalCents: number;
  promptpayRef: string;
  trackingNumber: string | null;
  user: { email: string };
  items: { productTitleSnapshot: string; quantity: number; variantAttributesSnapshot: unknown }[];
};

export function OrdersQueue({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const decide = trpc.admin.decidePayment.useMutation({
    onSuccess: () => {
      toast.message("Payment updated");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const fulfill = trpc.admin.fulfill.useMutation({
    onSuccess: () => {
      toast.message("Order updated");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className={`rounded-xl border border-border bg-card p-4 ${order.status === "PENDING" ? "border-l-2 border-l-brass" : ""}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-tabular text-sm">{order.promptpayRef}</p>
              <p className="text-sm text-muted-foreground">{order.user.email}</p>
              <ul className="mt-2 text-sm">
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.productTitleSnapshot} · {formatAttributes(item.variantAttributesSnapshot)} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right">
              <p className="font-tabular text-brass">{formatMoney(order.totalCents)}</p>
              <StatusChip
                tone={order.status === "CANCELLED" || order.status === "REFUNDED" ? "brick" : order.status === "PENDING" ? "brass" : "forest"}
              >
                {order.slipUncertain && order.status === "PENDING" ? "needs review" : order.status.toLowerCase()}
              </StatusChip>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {order.status === "PENDING" ? (
              <>
                <Button size="sm" onClick={() => decide.mutate({ orderId: order.id, approve: true })}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => decide.mutate({ orderId: order.id, approve: false })}>
                  Reject
                </Button>
              </>
            ) : null}
            {order.status === "PAID" ? (
              <Button size="sm" onClick={() => fulfill.mutate({ orderId: order.id, status: "PACKED" })}>
                Mark packed
              </Button>
            ) : null}
            {order.status === "PACKED" ? (
              <ShipForm
                onShip={(trackingNumber, shippingCarrier) =>
                  fulfill.mutate({ orderId: order.id, status: "SHIPPED", trackingNumber, shippingCarrier })
                }
              />
            ) : null}
            {order.status === "SHIPPED" ? (
              <Button size="sm" onClick={() => fulfill.mutate({ orderId: order.id, status: "DELIVERED" })}>
                Mark delivered
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShipForm({ onShip }: { onShip: (tracking: string, carrier: string) => void }) {
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onShip(String(data.get("tracking") ?? ""), String(data.get("carrier") ?? "Kerry"));
      }}
    >
      <Input name="carrier" placeholder="Carrier" defaultValue="Kerry" className="w-28" />
      <Input name="tracking" placeholder="Tracking number" className="font-tabular w-40" required />
      <Button size="sm" type="submit">
        Mark shipped
      </Button>
    </form>
  );
}
