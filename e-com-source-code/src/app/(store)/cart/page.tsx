import { CartView } from "@/components/cart/cart-view";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function CartPage() {
  const storefront = await getStorefrontConfig();
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">Cart</h1>
      <CartView storeMode={storefront.storeMode} />
    </div>
  );
}
