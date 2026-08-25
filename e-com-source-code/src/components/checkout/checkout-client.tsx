"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInSeconds } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { formatAttributes } from "@/lib/product";
import { trpc } from "@/trpc/client";

export function PaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [slip, setSlip] = useState("");
  const [phase, setPhase] = useState<"waiting" | "verifying" | "confirmed">("waiting");
  const order = trpc.order.byId.useQuery({ orderId }, { refetchInterval: phase === "confirmed" ? false : 2000 });
  const transfer = trpc.order.markTransferred.useMutation({
    onSuccess: () => {
      setPhase("verifying");
      toast.message("Verifying slip");
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!order.data) return;
    if (order.data.status !== "PENDING") {
      setPhase("confirmed");
      const timeout = window.setTimeout(() => router.push(`/orders/${orderId}`), 800);
      return () => window.clearTimeout(timeout);
    }
    if (order.data.slipUncertain) setPhase("verifying");
  }, [order.data, orderId, router]);

  const remaining = useMemo(() => {
    if (!order.data) return 0;
    return Math.max(0, differenceInSeconds(new Date(order.data.expiresAt), new Date(now)));
  }, [order.data, now]);

  if (!order.data) return <p className="text-sm text-muted-foreground">Loading payment…</p>;

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        {order.data.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 py-2 text-sm">
            <span>
              {item.productTitleSnapshot}
              <span className="block text-muted-foreground">
                {formatAttributes(item.variantAttributesSnapshot)} × {item.quantity}
              </span>
            </span>
            <span className="font-tabular">{formatMoney(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between text-sm">
          <span>Shipping</span>
          <span className="font-tabular">{formatMoney(order.data.shippingFeeCents)}</span>
        </div>
        <div className="mt-2 flex justify-between font-medium">
          <span>Total</span>
          <span className="font-tabular text-brass">{formatMoney(order.data.totalCents)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusChip
          tone={phase === "confirmed" ? "forest" : phase === "verifying" ? "brass" : "muted"}
          pulse={phase === "verifying"}
        >
          {phase === "confirmed" ? "payment confirmed" : phase === "verifying" ? "verifying slip" : "waiting for payment"}
        </StatusChip>
        <p className="font-tabular text-xs text-muted-foreground">
          {order.data.promptpayRef} · {minutes}:{seconds}
        </p>
      </div>

      {order.data.qr && phase !== "confirmed" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.data.qr.dataUrl} alt="PromptPay QR" className="size-56 rounded-md bg-white" />
        </div>
      ) : null}

      {phase !== "confirmed" ? (
        <div className="space-y-3">
          <Input placeholder="Slip image URL (optional)" value={slip} onChange={(event) => setSlip(event.target.value)} />
          <Button
            className="w-full"
            disabled={transfer.isPending || remaining === 0}
            onClick={() => transfer.mutate({ orderId, slipImageUrl: slip || undefined })}
          >
            I've transferred
          </Button>
        </div>
      ) : (
        <p className="text-sm text-primary">Payment confirmed. Opening your order…</p>
      )}
    </div>
  );
}
