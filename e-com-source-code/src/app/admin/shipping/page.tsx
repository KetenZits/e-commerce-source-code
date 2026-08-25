import { ShippingAdmin } from "@/components/admin/shipping-admin";
import { serverCaller } from "@/trpc/server";

export default async function ShippingSettingsPage() {
  const zones = await (await serverCaller()).admin.shippingZones();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Shipping</h1>
        <p className="text-sm text-muted-foreground">
          Zones are matched by province then weight, in sort order. Use * for nationwide fallback.
        </p>
      </div>
      <ShippingAdmin zones={zones} />
    </div>
  );
}
