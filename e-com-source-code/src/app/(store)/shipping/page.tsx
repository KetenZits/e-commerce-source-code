import Link from "next/link";
import { ShippingInfo } from "@/components/shipping/shipping-info";
import { SectionDivider } from "@/components/section-divider";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export default async function ShippingPage() {
  const zones = await db.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span>Shipping</span>
      </nav>
      <section className="grid gap-8 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="max-w-2xl space-y-4">
          <p className="eyebrow">From our studio to your door</p>
          <h1 className="font-display text-4xl sm:text-5xl">Shipping, without surprises.</h1>
          <p className="leading-7 text-muted-foreground">
            Every order leaves Bangkok after PromptPay confirmation. We calculate the
            final rate from destination and packed weight before you pay.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-sm leading-6">
          <p className="eyebrow">At a glance</p>
          <p className="mt-3">Bangkok metro: 2–4 business days</p>
          <p>Other provinces: 4–7 business days</p>
          <p className="text-muted-foreground">Tracking is added as soon as the parcel ships.</p>
        </div>
      </section>
      <ShippingInfo />
      <SectionDivider />
      <section className="space-y-5">
        <div>
          <p className="eyebrow">Current rates</p>
          <h2 className="font-display mt-2 text-2xl">Rates used at checkout</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm">{zone.name}</p>
                  <p className="font-tabular mt-1 text-xs text-muted-foreground">
                    {zone.minWeightGrams}g–{zone.maxWeightGrams ? `${zone.maxWeightGrams}g` : "no limit"}
                  </p>
                </div>
                <p className="font-tabular text-brass">{formatMoney(zone.feeCents)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SectionDivider />
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Shipping questions</h2>
        {[
          ["When does my order ship?", "Orders are prepared after payment verification, usually within one business day."],
          ["Can I change my address?", "Contact the studio before the order is marked Packed. We cannot redirect a parcel after handoff."],
          ["What if my parcel arrives damaged?", "Photograph the parcel and item, then contact us within 7 days so we can arrange a replacement or refund."],
        ].map(([question, answer]) => (
          <details key={question} className="group rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer list-none text-sm font-medium">
              {question}
              <span className="float-right text-muted-foreground group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
