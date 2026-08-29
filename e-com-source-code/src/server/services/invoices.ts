import { format } from "date-fns";
import type { TaxConfig } from "@/lib/commerce-config";

export function nextInvoiceNumber(date = new Date()) {
  const stamp = format(date, "yyyyMMdd");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ATL-${stamp}-${rand}`;
}

export function invoicePayload(order: {
  invoiceNumber: string | null;
  promptpayRef: string;
  createdAt: Date;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingFeeCents: number;
  totalCents: number;
  billingDetails: unknown;
  guestName?: string | null;
  guestEmail?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
  items: {
    productTitleSnapshot: string;
    quantity: number;
    unitPriceCents: number;
  }[];
}, tax: TaxConfig) {
  const billedTo =
    order.billingDetails && typeof order.billingDetails === "object"
      ? (order.billingDetails as Record<string, string>)
      : {
          name: order.user?.name || order.guestName || "Customer",
          taxId: "",
          address: "",
        };
  return {
    invoiceNumber: order.invoiceNumber ?? nextInvoiceNumber(order.createdAt),
    issuedAt: order.createdAt,
    reference: order.promptpayRef,
    seller: {
      name: tax.businessName,
      taxId: tax.taxId,
      address: tax.address,
    },
    buyer: billedTo,
    email: order.user?.email || order.guestEmail,
    lines: order.items.map((item) => ({
      title: item.productTitleSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.unitPriceCents * item.quantity,
    })),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    shippingFeeCents: order.shippingFeeCents,
    totalCents: order.totalCents,
  };
}
