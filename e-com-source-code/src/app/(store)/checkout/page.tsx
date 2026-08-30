import { getStorefrontConfig } from "@/lib/storefront-config";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getI18n } from "@/lib/i18n/get-locale";

export default async function CheckoutStartPage() {
  const [storefront, { t }] = await Promise.all([getStorefrontConfig(), getI18n()]);
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <h1 className="font-display text-3xl">{t("checkout.title")}</h1>
      <CheckoutFlow storeMode={storefront.storeMode} />
    </div>
  );
}
