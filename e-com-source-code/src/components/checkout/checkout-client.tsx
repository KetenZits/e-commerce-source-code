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

export function PaymentClient({
  orderId,
  guestToken,
}: {
  orderId: string;
  guestToken?: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [slipUrl, setSlipUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<"waiting" | "verifying">("waiting");
  const order = trpc.order.byId.useQuery(
    { orderId, guestToken },
    { refetchInterval: 2000 },
  );
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
      const suffix = guestToken ? `?g=${guestToken}` : "";
      const timeout = window.setTimeout(() => router.push(`/orders/${orderId}${suffix}`), 800);
      return () => window.clearTimeout(timeout);
    }
  }, [order.data, orderId, router, guestToken]);

  const remaining = useMemo(() => {
    if (!order.data) return 0;
    return Math.max(0, differenceInSeconds(new Date(order.data.expiresAt), new Date(now)));
  }, [order.data, now]);

  async function uploadSlip(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("orderId", orderId);
      if (guestToken) data.set("guestToken", guestToken);
      const res = await fetch("/api/checkout/slip", { method: "POST", body: data });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      setSlipUrl(json.url);
      toast.message("Slip uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!order.data) return <p className="text-sm text-muted-foreground">Loading payment…</p>;

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const displayPhase =
    order.data.status !== "PENDING"
      ? "confirmed"
      : order.data.slipUncertain
        ? "verifying"
        : phase;

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
        {order.data.discountCents ? (
          <div className="mt-2 flex justify-between text-sm text-primary">
            <span>Discount</span>
            <span className="font-tabular">-{formatMoney(order.data.discountCents)}</span>
          </div>
        ) : null}
        {order.data.taxCents ? (
          <div className="mt-2 flex justify-between text-sm">
            <span>VAT</span>
            <span className="font-tabular">{formatMoney(order.data.taxCents)}</span>
          </div>
        ) : null}
        <div className="mt-3 flex justify-between text-sm">
          <span>
            {order.data.fulfillmentType === "DIGITAL" ? "Digital delivery" : "Shipping"}
          </span>
          <span className="font-tabular">{formatMoney(order.data.shippingFeeCents)}</span>
        </div>
        <div className="mt-2 flex justify-between font-medium">
          <span>Total</span>
          <span className="font-tabular text-brass">{formatMoney(order.data.totalCents)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusChip
          tone={displayPhase === "confirmed" ? "forest" : displayPhase === "verifying" ? "brass" : "muted"}
          pulse={displayPhase === "verifying"}
        >
          {displayPhase === "confirmed" ? "payment confirmed" : displayPhase === "verifying" ? "verifying slip" : "waiting for payment"}
        </StatusChip>
        <p className="font-tabular text-xs text-muted-foreground">
          {order.data.promptpayRef} · {minutes}:{seconds}
        </p>
      </div>

      {order.data.qr && displayPhase !== "confirmed" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.data.qr.dataUrl} alt="PromptPay QR" className="size-56 rounded-md bg-white" />
          <p className="text-sm">{order.data.payment.accountName}</p>
          <p className="font-tabular text-xs text-muted-foreground">{order.data.payment.promptpayId}</p>
          {order.data.payment.paymentMode === "demo" ? (
            <p className="text-center text-xs text-muted-foreground">
              Demo mode: no real transfer is required. Press I&apos;ve transferred to confirm the order.
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Scan with a Thai bank app, then upload the slip and confirm below.</p>
          )}
        </div>
      ) : null}

      {displayPhase !== "confirmed" ? (
        <div className="space-y-3">
          <Input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => uploadSlip(event.target.files?.[0])}
          />
          {slipUrl ? <p className="text-xs text-primary">Slip attached</p> : null}
          <Button
            className="w-full"
            disabled={transfer.isPending || remaining === 0 || uploading}
            onClick={() => transfer.mutate({ orderId, guestToken, slipImageUrl: slipUrl })}
          >
            I&apos;ve transferred
          </Button>
        </div>
      ) : (
        <p className="text-sm text-primary">Payment confirmed. Opening your order…</p>
      )}
    </div>
  );
}
