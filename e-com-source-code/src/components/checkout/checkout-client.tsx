"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInSeconds } from "date-fns";
import { toast } from "sonner";
import { CodeCard } from "@/components/product/code-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { trpc } from "@/trpc/client";

export function CheckoutClient({ orderId }: { orderId: string }) {
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
    if (order.data?.status === "PAID") {
      setPhase("confirmed");
      const timeout = window.setTimeout(() => router.push("/dashboard/purchases?paid=1"), 900);
      return () => window.clearTimeout(timeout);
    }
    if (order.data?.slipImageUrl || (order.data?.slipUncertain && order.data.status === "PENDING")) {
      setPhase("verifying");
    }
  }, [order.data, router]);

  const remaining = useMemo(() => {
    if (!order.data) return 0;
    return Math.max(0, differenceInSeconds(new Date(order.data.expiresAt), new Date(now)));
  }, [order.data, now]);

  if (order.isLoading || !order.data) {
    return <p className="font-mono text-sm text-muted-foreground">Loading payment…</p>;
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <CodeCard product={order.data.product} />
      <div className="flex items-center justify-between">
        <p className="font-heading text-xl text-amber">{formatMoney(order.data.priceCents, order.data.currency)}</p>
        <StatusChip tone={phase === "confirmed" ? "add" : phase === "verifying" ? "amber" : "muted"} pulse={phase === "verifying"}>
          {phase === "confirmed" ? "payment confirmed" : phase === "verifying" ? "verifying slip" : "waiting for payment"}
        </StatusChip>
      </div>
      {order.data.qr && phase !== "confirmed" ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-hair bg-surface p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.data.qr.dataUrl} alt="PromptPay QR" className="size-56 rounded-md bg-foreground" />
          <p className="font-plex text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            ref {order.data.promptpayRef} · {minutes}:{seconds}
          </p>
        </div>
      ) : null}
      {phase !== "confirmed" ? (
        <div className="space-y-3">
          <Input
            placeholder="Slip image URL (optional)"
            value={slip}
            onChange={(event) => setSlip(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={transfer.isPending || remaining === 0}
            onClick={() => transfer.mutate({ orderId, slipImageUrl: slip || undefined })}
          >
            I've transferred
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Demo mode confirms the transfer automatically. Live mode sends the slip to SlipOK or EasySlip, then to the admin queue if the amount is uncertain.
          </p>
        </div>
      ) : (
        <p className="font-mono text-sm text-add">payment confirmed. opening my purchases…</p>
      )}
    </div>
  );
}
