import { getStorefrontConfig } from "@/lib/storefront-config";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export default async function CheckoutStartPage() {
  const storefront = await getStorefrontConfig();
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">Checkout</h1>
      <CheckoutFlow storeMode={storefront.storeMode} />
    </div>
  );
}
