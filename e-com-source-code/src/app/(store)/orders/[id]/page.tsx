import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { SectionDivider } from "@/components/section-divider";
import { StatusChip } from "@/components/ui/status-chip";
import { formatMoney } from "@/lib/money";
import { formatAttributes } from "@/lib/product";
import { authOptions } from "@/server/auth";
import { serverCaller } from "@/trpc/server";
import { OrderCustomerActions } from "@/components/orders/order-customer-actions";

const tone: Record<string, "muted" | "brass" | "forest" | "brick"> = {
  PENDING: "brass",
  PAID: "forest",
  PACKED: "forest",
  SHIPPED: "forest",
  DELIVERED: "forest",
  CANCELLED: "brick",
  REFUNDED: "brick",
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const { g } = await searchParams;
  if (!session?.user && !g) redirect("/auth/signin");
  const order = await (await serverCaller()).order.byId({ orderId: id, guestToken: g });
  if (!order) notFound();
  const digital = order.fulfillmentType !== "PHYSICAL";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p className="eyebrow">Order {order.promptpayRef}</p>
      <h1 className="font-display text-3xl">
        {order.status === "PENDING"
          ? "Waiting for payment"
          : digital && order.status === "DELIVERED"
            ? "Your digital order is ready"
            : "Order confirmed"}
      </h1>
      <StatusChip tone={tone[order.status] ?? "muted"}>{order.status.toLowerCase()}</StatusChip>
      <p className="text-muted-foreground">
        {order.fulfillmentType === "DIGITAL"
          ? order.status === "DELIVERED"
            ? "Your access details are available below."
            : "Payment is confirmed. The store is preparing your digital access details."
          : `Estimated delivery ${order.estimatedDelivery ?? "—"}.${
              order.trackingNumber
                ? ` Tracking ${order.trackingNumber} (${order.shippingCarrier ?? "carrier"}).`
                : ""
            }`}
      </p>
      {digital && order.digitalDelivery ? (
        <section className="rounded-xl border border-primary/40 bg-card p-5">
          <p className="eyebrow">Digital access</p>
          <h2 className="font-display mt-2 text-xl">Delivery details</h2>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-6">
            {order.digitalDelivery}
          </pre>
        </section>
      ) : null}
      <SectionDivider />
      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.productTitleSnapshot}
              <span className="block text-muted-foreground">
                {formatAttributes(item.variantAttributesSnapshot)} × {item.quantity}
              </span>
            </span>
            <span className="font-tabular">{formatMoney(item.unitPriceCents * item.quantity)}</span>
          </div>
        ))}
        {order.discountCents ? (
          <div className="flex justify-between text-sm text-primary">
            <span>Discount</span>
            <span className="font-tabular">-{formatMoney(order.discountCents)}</span>
          </div>
        ) : null}
        {order.taxCents ? (
          <div className="flex justify-between text-sm">
            <span>VAT</span>
            <span className="font-tabular">{formatMoney(order.taxCents)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-sm">
          <span>{order.fulfillmentType === "DIGITAL" ? "Digital delivery" : "Shipping"}</span>
          <span className="font-tabular">{formatMoney(order.shippingFeeCents)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span className="font-tabular text-brass">{formatMoney(order.totalCents)}</span>
        </div>
      </div>
      {order.address ? (
        <p className="text-sm leading-6 text-muted-foreground">
          {order.address.recipientName}
          <br />
          {order.address.addressLine1}, {order.address.subdistrict}, {order.address.district}, {order.address.province}{" "}
          {order.address.postalCode}
        </p>
      ) : null}
      <OrderCustomerActions
        orderId={order.id}
        status={order.status}
        guestToken={g}
        invoiceNumber={order.invoiceNumber}
      />
    </div>
  );
}
