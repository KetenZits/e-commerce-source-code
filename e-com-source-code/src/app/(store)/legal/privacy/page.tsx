import { LegalPage } from "@/components/legal/legal-page";
import { PrivacyActions } from "@/components/legal/privacy-actions";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function PrivacyPage() {
  const [store, { t }] = await Promise.all([getStorefrontConfig(), getI18n()]);
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title={t("legal.privacy")}>
      <p>{t("legal.privacyP1", { name })}</p>
      <p>{t("legal.privacyP2")}</p>
      <p>{t("legal.privacyP3", { email: business.contactEmail })}</p>
      <PrivacyActions />
    </LegalPage>
  );
}
