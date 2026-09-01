"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  KeyRound,
  Package,
  PackageCheck,
  Truck,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney, bahtToSatang } from "@/lib/money";
import { trpc } from "@/trpc/client";

export type ActionableOrder = {
  id: string;
  status: string;
  fulfillmentType: string;
  digitalDelivery?: string | null;
  totalCents?: number;
};

function stop(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function ActionButton({
  compact,
  label,
  icon,
  variant = "ghost",
  onClick,
  disabled,
}: {
  compact: boolean;
  label: string;
  icon: ReactNode;
  variant?: "ghost" | "outline" | "default" | "destructive";
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (compact) {
    return (
      <Button
        type="button"
        size="icon-sm"
        variant={variant === "default" ? "ghost" : variant}
        title={label}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Button>
    );
  }
  return (
    <Button type="button" size="sm" variant={variant === "ghost" ? "outline" : variant} disabled={disabled} onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}

export function OrderActions({
  order,
  detail = false,
}: {
  order: ActionableOrder;
  detail?: boolean;
}) {
  const router = useRouter();
  const compact = !detail;
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
  const canRefund = ["PAID", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status);
  const canFulfillDigital = hasDigital && canRefund;
  const busy =
    decide.isPending || fulfill.isPending || deliverDigital.isPending || refund.isPending;

  const buttons: ReactNode[] = [];

  if (order.status === "PENDING") {
    buttons.push(
      <ActionButton
        key="approve"
        compact={compact}
        label="Approve"
        icon={<Check className="size-3.5" />}
        variant={compact ? "ghost" : "default"}
        disabled={busy}
        onClick={() => decide.mutate({ orderId: order.id, approve: true })}
      />,
      <ActionButton
        key="reject"
        compact={compact}
        label="Reject"
        icon={<X className="size-3.5" />}
        variant="destructive"
        disabled={busy}
        onClick={() => decide.mutate({ orderId: order.id, approve: false })}
      />,
    );
  }

  if (canFulfillDigital && !detail) {
    const delivered = order.status === "DELIVERED";
    buttons.push(
      <ActionButton
        key="digital"
        compact
        label={delivered ? "View delivery" : "Add delivery"}
        icon={delivered ? <Eye className="size-3.5" /> : <KeyRound className="size-3.5" />}
        onClick={() => router.push(`/admin/orders/${order.id}`)}
      />,
    );
  }

  if (hasPhysical && order.status === "PAID") {
    buttons.push(
      <ActionButton
        key="packed"
        compact={compact}
        label="Mark packed"
        icon={<Package className="size-3.5" />}
        variant={compact ? "ghost" : "default"}
        disabled={busy}
        onClick={() => fulfill.mutate({ orderId: order.id, status: "PACKED" })}
      />,
    );
  }

  if (hasPhysical && order.status === "PACKED") {
    buttons.push(
      <ShipDialog
        key="ship"
        compact={compact}
        disabled={busy}
        onSubmit={(input) =>
          fulfill.mutate({
            orderId: order.id,
            status: "SHIPPED",
            ...input,
          })
        }
      />,
    );
  }

  if (hasPhysical && order.status === "SHIPPED") {
    buttons.push(
      <ActionButton
        key="delivered"
        compact={compact}
        label="Mark delivered"
        icon={<PackageCheck className="size-3.5" />}
        variant={compact ? "ghost" : "default"}
        disabled={busy}
        onClick={() => fulfill.mutate({ orderId: order.id, status: "DELIVERED" })}
      />,
    );
  }

  if (canRefund) {
    buttons.push(
      <RefundDialog
        key="refund"
        compact={compact}
        disabled={busy || refund.isPending}
        totalCents={order.totalCents}
        onSubmit={(input) => refund.mutate({ orderId: order.id, ...input })}
      />,
    );
  }

  if (buttons.length === 0 && !detail) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-4" onClick={stop} onKeyDown={stop}>
      {buttons.length > 0 ? (
        <div
          className={
            compact
              ? "inline-flex items-center rounded-lg border border-border bg-background p-0.5"
              : "flex flex-wrap items-center gap-2"
          }
        >
          {buttons}
        </div>
      ) : null}

      {detail && canFulfillDigital ? (
        <form
          className="max-w-2xl space-y-3 rounded-xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
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
              Add the game ID, code, password, download link, or customer instructions. This field
              is encrypted before it is stored.
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
      ) : null}
    </div>
  );
}

function RefundDialog({
  compact,
  disabled,
  totalCents,
  onSubmit,
}: {
  compact: boolean;
  disabled?: boolean;
  totalCents?: number;
  onSubmit: (input: { amountCents: number; reason: string; restock: boolean }) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          compact ? (
            <Button type="button" size="icon-sm" variant="ghost" title="Refund" disabled={disabled} />
          ) : (
            <Button type="button" size="sm" variant="outline" disabled={disabled} />
          )
        }
      >
        <Undo2 className="size-3.5" />
        {compact ? <span className="sr-only">Refund</span> : "Refund"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={stop}>
        <DialogHeader>
          <DialogTitle>Refund order</DialogTitle>
          <DialogDescription>
            Record a refund
            {totalCents != null ? ` up to ${formatMoney(totalCents)}` : ""}. Restock returns the
            units to inventory.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onSubmit({
              amountCents: bahtToSatang(Number(data.get("amount"))),
              reason: String(data.get("reason") ?? "Customer return"),
              restock: data.get("restock") === "on",
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Amount (฿)</Label>
            <Input
              id="refund-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="font-tabular"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Input id="refund-reason" name="reason" required placeholder="Customer return" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="restock" defaultChecked />
            Restock items
          </label>
          <DialogFooter>
            <Button type="submit" variant="destructive" size="sm">
              Confirm refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShipDialog({
  compact,
  disabled,
  onSubmit,
}: {
  compact: boolean;
  disabled?: boolean;
  onSubmit: (input: { trackingNumber: string; shippingCarrier: string }) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          compact ? (
            <Button type="button" size="icon-sm" variant="ghost" title="Mark shipped" disabled={disabled} />
          ) : (
            <Button type="button" size="sm" disabled={disabled} />
          )
        }
      >
        <Truck className="size-3.5" />
        {compact ? <span className="sr-only">Mark shipped</span> : "Mark shipped"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onClick={stop}>
        <DialogHeader>
          <DialogTitle>Mark as shipped</DialogTitle>
          <DialogDescription>Add carrier and tracking so the customer can follow the parcel.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onSubmit({
              trackingNumber: String(data.get("tracking") ?? ""),
              shippingCarrier: String(data.get("carrier") ?? "Kerry"),
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ship-carrier">Carrier</Label>
            <Input id="ship-carrier" name="carrier" defaultValue="Kerry" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ship-tracking">Tracking number</Label>
            <Input id="ship-tracking" name="tracking" className="font-tabular" required />
          </div>
          <DialogFooter>
            <Button type="submit" size="sm">
              Mark shipped
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
