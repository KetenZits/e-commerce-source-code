"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

export type ActionableOrder = {
  id: string;
  status: string;
};

export function OrderActions({ order }: { order: ActionableOrder }) {
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
      {order.status === "PAID" ? (
        <Button
          size="sm"
          onClick={() => fulfill.mutate({ orderId: order.id, status: "PACKED" })}
        >
          Mark packed
        </Button>
      ) : null}
      {order.status === "PACKED" ? (
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
      {order.status === "SHIPPED" ? (
        <Button
          size="sm"
          onClick={() => fulfill.mutate({ orderId: order.id, status: "DELIVERED" })}
        >
          Mark delivered
        </Button>
      ) : null}
    </div>
  );
}
