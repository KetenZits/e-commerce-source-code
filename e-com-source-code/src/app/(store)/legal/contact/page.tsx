import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function ContactPage() {
  const [store, { t }] = await Promise.all([getStorefrontConfig(), getI18n()]);
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title={t("legal.contact")}>
      <p>
        {name} · {business.city}, {business.country}
      </p>
      <p>{business.address}</p>
      <p>
        {t("legal.email")} {business.contactEmail}
        {business.phone ? ` · ${business.phone}` : ""}.
      </p>
      <p>
        {t("legal.contactPrivacy")}{" "}
        <Link href="/legal/privacy" className="text-primary">
          {t("legal.privacyPage")}
        </Link>
        .
      </p>
    </LegalPage>
  );
}
