import { LegalPage } from "@/components/legal/legal-page";
import { PrivacyActions } from "@/components/legal/privacy-actions";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function PrivacyPage() {
  const store = await getStorefrontConfig();
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title="Privacy">
      <p>
        This page is a template for {name}. Have it reviewed for PDPA or other privacy law that
        applies to you before launch.
      </p>
      <p>
        We store account details, addresses, order history, payment slips, and a cart cookie to
        complete checkout. PromptPay slips are kept to prevent duplicate payments. Analytics cookies
        load only if you accept them.
      </p>
      <p>
        You can export or delete your account below when you have no open orders. We do not sell
        personal data. Questions: {business.contactEmail}.
      </p>
      <PrivacyActions />
    </LegalPage>
  );
}
