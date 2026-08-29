import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { formatMoney } from "@/lib/money";
import { authOptions } from "@/server/auth";
import { serverCaller } from "@/trpc/server";

export default async function InvoicePage({
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
  const invoice = await (await serverCaller()).order.invoice({ orderId: id, guestToken: g });
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p className="eyebrow">Tax invoice</p>
      <h1 className="font-display text-3xl">{invoice.invoiceNumber}</h1>
      <p className="text-sm text-muted-foreground">Reference {invoice.reference}</p>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium">{invoice.seller.name}</p>
          <p className="text-muted-foreground">{invoice.seller.address}</p>
          {invoice.seller.taxId ? <p className="font-tabular mt-1">Tax ID {invoice.seller.taxId}</p> : null}
        </div>
        <div>
          <p className="font-medium">{invoice.buyer.name}</p>
          <p className="text-muted-foreground">{invoice.buyer.address}</p>
        </div>
      </div>
      <div className="space-y-2">
        {invoice.lines.map((line) => (
          <div key={line.title} className="flex justify-between text-sm">
            <span>
              {line.title} × {line.quantity}
            </span>
            <span className="font-tabular">{formatMoney(line.lineTotalCents)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-tabular">{formatMoney(invoice.subtotalCents)}</span>
        </div>
        {invoice.discountCents ? (
          <div className="flex justify-between text-sm">
            <span>Discount</span>
            <span className="font-tabular">-{formatMoney(invoice.discountCents)}</span>
          </div>
        ) : null}
        {invoice.taxCents ? (
          <div className="flex justify-between text-sm">
            <span>VAT</span>
            <span className="font-tabular">{formatMoney(invoice.taxCents)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span className="font-tabular">{formatMoney(invoice.totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
