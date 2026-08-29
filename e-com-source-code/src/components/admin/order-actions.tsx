"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { bahtToSatang } from "@/lib/money";
import { trpc } from "@/trpc/client";

export type ActionableOrder = {
  id: string;
  status: string;
  fulfillmentType: string;
  digitalDelivery?: string | null;
};

export function OrderActions({
  order,
  detail = false,
}: {
  order: ActionableOrder;
  detail?: boolean;
}) {
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
  const deliverDigital = trpc.admin.deliverDigital.useMutation({
    onSuccess: () => {
      toast.message("Digital access delivered");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const refund = trpc.admin.refund.useMutation({
    onSuccess: () => {
      toast.message("Refund recorded");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const hasDigital = order.fulfillmentType !== "PHYSICAL";
  const hasPhysical = order.fulfillmentType !== "DIGITAL";

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className="flex flex-wrap gap-2" onClick={stop}>
      {order.status === "PENDING" ? (
        <>
          <Button
            size="sm"
            onClick={() => decide.mutate({ orderId: order.id, approve: true })}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => decide.mutate({ orderId: order.id, approve: false })}
          >
            Reject
          </Button>
        </>
      ) : null}
      {hasDigital && ["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) ? (
        detail ? (
          <form
            className="w-full max-w-2xl space-y-3 rounded-xl border border-primary/30 bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const data = new FormData(event.currentTarget);
              deliverDigital.mutate({
                orderId: order.id,
                content: String(data.get("digitalDelivery") ?? ""),
              });
            }}
          >
            <div>
              <p className="text-sm font-medium">Digital access details</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the game ID, code, password, download link, or customer instructions.
                This field is encrypted before it is stored.
              </p>
            </div>
            <Textarea
              name="digitalDelivery"
              rows={7}
              required
              defaultValue={order.digitalDelivery ?? ""}
              placeholder={"Game ID: ...\nPassword: ...\nInstructions: ..."}
            />
            <Button size="sm" type="submit" disabled={deliverDigital.isPending}>
              {deliverDigital.isPending
                ? "Delivering"
                : order.status === "DELIVERED"
                  ? "Update delivery"
                  : "Deliver to customer"}
            </Button>
          </form>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/orders/${order.id}`)}
          >
            {order.status === "DELIVERED" ? "View delivery" : "Add delivery"}
          </Button>
        )
      ) : null}
      {hasPhysical && order.status === "PAID" ? (
        <Button
          size="sm"
          onClick={() => fulfill.mutate({ orderId: order.id, status: "PACKED" })}
        >
          Mark packed
        </Button>
      ) : null}
      {hasPhysical && order.status === "PACKED" ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const data = new FormData(event.currentTarget);
            fulfill.mutate({
              orderId: order.id,
              status: "SHIPPED",
              trackingNumber: String(data.get("tracking") ?? ""),
              shippingCarrier: String(data.get("carrier") ?? "Kerry"),
            });
          }}
        >
          <Input name="carrier" placeholder="Carrier" defaultValue="Kerry" className="w-28" />
          <Input
            name="tracking"
            placeholder="Tracking number"
            className="font-tabular w-40"
            required
          />
          <Button size="sm" type="submit">Mark shipped</Button>
        </form>
      ) : null}
      {hasPhysical && order.status === "SHIPPED" ? (
        <Button
          size="sm"
          onClick={() => fulfill.mutate({ orderId: order.id, status: "DELIVERED" })}
        >
          Mark delivered
        </Button>
      ) : null}
      {["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) ? (
        <form
          className="flex w-full max-w-xl flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const data = new FormData(event.currentTarget);
            refund.mutate({
              orderId: order.id,
              amountCents: bahtToSatang(Number(data.get("amount"))),
              reason: String(data.get("reason") ?? "Customer return"),
              restock: data.get("restock") === "on",
            });
          }}
        >
          <Input name="amount" type="number" step="0.01" placeholder="Refund ฿" className="font-tabular w-28" required />
          <Input name="reason" placeholder="Reason" className="w-40" required />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="restock" defaultChecked />
            Restock
          </label>
          <Button size="sm" type="submit" variant="outline" disabled={refund.isPending}>
            Refund
          </Button>
        </form>
      ) : null}
    </div>
  );
}
