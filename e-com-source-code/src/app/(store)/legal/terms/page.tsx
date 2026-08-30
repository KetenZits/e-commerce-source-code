import { LegalPage } from "@/components/legal/legal-page";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function TermsPage() {
  const [store, { t }] = await Promise.all([getStorefrontConfig(), getI18n()]);
  const { business, siteName } = store;
  const name = business.legalName || siteName;
  const phone = business.phone ? ` · ${business.phone}` : "";

  return (
    <LegalPage title={t("legal.terms")}>
      <p>{t("legal.termsP1", { name })}</p>
      <p>{t("legal.termsP2", { name, city: business.city, country: business.country })}</p>
      <p>{t("legal.termsP3")}</p>
      <p>{t("legal.termsP4", { email: business.contactEmail, phone })}</p>
    </LegalPage>
  );
}
