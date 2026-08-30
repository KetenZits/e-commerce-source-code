import { LegalPage } from "@/components/legal/legal-page";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function ReturnsPage() {
  const [store, { t }] = await Promise.all([getStorefrontConfig(), getI18n()]);
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title={t("legal.returns")}>
      <p>{t("legal.returnsP1", { days: business.returnDays })}</p>
      <p>{t("legal.returnsP2", { name })}</p>
      <p>{t("legal.returnsP3", { email: business.contactEmail })}</p>
    </LegalPage>
  );
}
