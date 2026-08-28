import { PackageCheck, RotateCcw, Truck } from "lucide-react";
import { StaggerItem, StaggerRoot } from "@/components/motion/stagger";
import { TiltCard } from "@/components/motion/tilt-card";

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
    <StaggerRoot className="grid gap-4 md:grid-cols-3">
      {ITEMS.map((item) => (
        <StaggerItem key={item.title}>
          <TiltCard className="h-full" intensity={5}>
        <article className="premium-depth h-full rounded-xl border border-border bg-card/90 p-5 backdrop-blur-sm">
          <item.icon className="size-5 text-primary" />
          <h3 className="font-display mt-4 text-lg">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </article>
          </TiltCard>
        </StaggerItem>
      ))}
    </StaggerRoot>
  );
}
