import { CartView } from "@/components/cart/cart-view";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function CartPage() {
  const [storefront, { t }] = await Promise.all([getStorefrontConfig(), getI18n()]);
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">{t("cart.title")}</h1>
      <CartView storeMode={storefront.storeMode} />
    </div>
  );
}
