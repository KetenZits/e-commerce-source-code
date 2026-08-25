"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/client";

type OrderRow = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  slipUncertain: boolean;
  priceCents: number;
  currency: string;
  promptpayRef: string;
  createdAt: Date | string;
  user: { email: string };
  product: { title: string };
};

export function OrdersQueue({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const decide = trpc.admin.decidePayment.useMutation({
    onSuccess: () => {
      toast.message("Order updated");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className={`flex flex-wrap items-center gap-3 rounded-lg border border-hair bg-surface px-3 py-3 ${order.status === "PENDING" ? "border-l-2 border-l-amber" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm">{order.product.title}</p>
            <p className="font-plex text-[11px] tracking-wide text-muted-foreground">
              {order.user.email} · {order.promptpayRef} · {formatMoney(order.priceCents, order.currency)}
            </p>
          </div>
          <StatusChip tone={order.status === "PAID" ? "add" : order.status === "FAILED" ? "del" : "amber"}>
            {order.slipUncertain && order.status === "PENDING" ? "needs review" : order.status.toLowerCase()}
          </StatusChip>
          {order.status === "PENDING" ? (
            <div className="flex gap-2">
              <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ orderId: order.id, approve: true })}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={decide.isPending}
                onClick={() => decide.mutate({ orderId: order.id, approve: false })}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
