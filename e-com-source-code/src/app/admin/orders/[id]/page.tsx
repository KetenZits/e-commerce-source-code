import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { SectionDivider } from "@/components/section-divider";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { formatAttributes } from "@/lib/product";
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await (await serverCaller()).admin.orderById({ id });
  if (!order) notFound();
  const digital = order.fulfillmentType === "DIGITAL";

  const events =
    order.statusEvents.length > 0
      ? order.statusEvents
      : [
          {
            id: "current",
            status: order.status,
            note: "Current status (created before history tracking was enabled).",
            createdAt: order.updatedAt,
          },
        ];

  return (
    <div className="space-y-7">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="font-tabular mt-2 text-2xl">{order.promptpayRef}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.user?.email ?? order.guestEmail ?? "Guest checkout"}</p>
        </div>
        <div className="space-y-2 text-right">
          <StatusChip tone={tone[order.status] ?? "muted"}>
            {order.status.toLowerCase()}
          </StatusChip>
          <p className="font-tabular text-xl text-brass">{formatMoney(order.totalCents)}</p>
        </div>
      </div>
      <OrderActions order={order} detail />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Items</h2>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-5 border-b border-border pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm">{item.productTitleSnapshot}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatAttributes(item.variantAttributesSnapshot)} × {item.quantity}
                  </p>
                </div>
                <p className="font-tabular text-sm">
                  {formatMoney(item.unitPriceCents * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <SectionDivider className="my-5" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-tabular">{formatMoney(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>{digital ? "Digital delivery" : "Shipping"}</span>
              <span className="font-tabular">{formatMoney(order.shippingFeeCents)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-tabular text-brass">{formatMoney(order.totalCents)}</span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl">
              {digital ? "Digital delivery" : "Shipping address"}
            </h2>
            {digital ? (
              <div className="mt-4 text-sm leading-6 text-muted-foreground">
                <p>
                  {order.digitalDeliveredAt
                    ? `Delivered ${new Date(order.digitalDeliveredAt).toLocaleString("en-GB")}`
                    : order.status === "PAID"
                      ? "Payment confirmed — access details are waiting to be delivered."
                      : "Access details become deliverable after payment confirmation."}
                </p>
                {order.digitalDelivery ? (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-foreground">
                    {order.digitalDelivery}
                  </pre>
                ) : null}
              </div>
            ) : order.address ? (
              <address className="mt-4 text-sm leading-6 text-muted-foreground not-italic">
                <strong className="text-foreground">{order.address.recipientName}</strong>
                <br />
                {order.address.phone}
                <br />
                {order.address.addressLine1}
                {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                <br />
                {order.address.subdistrict}, {order.address.district}
                <br />
                {order.address.province} {order.address.postalCode}
              </address>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Address no longer available.</p>
            )}
            {!digital && order.trackingNumber ? (
              <p className="font-tabular mt-4 text-xs">
                {order.shippingCarrier ?? "Carrier"} · {order.trackingNumber}
              </p>
            ) : null}
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl">Payment</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Verified</dt>
                <dd className="font-tabular">
                  {order.verifiedAt ? new Date(order.verifiedAt).toLocaleString("en-GB") : "Pending"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Slip</dt>
                <dd>
                  {order.slipImageUrl ? (
                    <a href={order.slipImageUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                      Open
                    </a>
                  ) : "—"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Status history</h2>
        <ol className="mt-5 space-y-0">
          {events.map((event, index) => (
            <li key={event.id} className="relative grid grid-cols-[16px_1fr] gap-3 pb-6 last:pb-0">
              {index < events.length - 1 ? (
                <span className="absolute top-3 bottom-0 left-[7px] w-px bg-border" />
              ) : null}
              <span className="relative z-10 mt-1.5 size-3 rounded-full border border-primary bg-card" />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusChip tone={tone[event.status] ?? "muted"}>
                    {event.status.toLowerCase()}
                  </StatusChip>
                  <time className="font-tabular text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString("en-GB")}
                  </time>
                </div>
                {event.note ? (
                  <p className="mt-2 text-sm text-muted-foreground">{event.note}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
