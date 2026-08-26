import { PackageCheck, RotateCcw, Truck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const ITEMS = [
  {
    icon: Truck,
    title: "Delivery time",
    text: "Bangkok metro arrives in 2–4 business days. Other provinces arrive in 4–7 business days after payment confirmation.",
  },
  {
    icon: PackageCheck,
    title: "Shipping cost",
    text: "Metro rates start at ฿50 and nationwide rates at ฿80. The final fee is calculated from province and parcel weight at checkout.",
  },
  {
    icon: RotateCcw,
    title: "Terms",
    text: "Inspect your parcel on arrival. Contact us within 7 days for damaged or incorrect items; used products cannot be returned.",
  },
];

export function ShippingInfo() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ITEMS.map((item, index) => (
        <Reveal
          key={item.title}
          delay={index * 70}
          className="rounded-xl border border-border bg-card p-5"
        >
          <item.icon className="size-5 text-primary" />
          <h3 className="font-display mt-4 text-lg">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </Reveal>
      ))}
    </div>
  );
}
