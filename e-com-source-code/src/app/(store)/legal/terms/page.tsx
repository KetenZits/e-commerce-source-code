import { LegalPage } from "@/components/legal/legal-page";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function TermsPage() {
  const store = await getStorefrontConfig();
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title="Terms of sale">
      <p>
        These terms are a template. Replace them with counsel-reviewed copy for {name} before you
        take real orders.
      </p>
      <p>
        Orders are placed with {name} ({business.city}, {business.country}) in Thai baht and paid by
        PromptPay. A contract is formed when payment is verified. Physical goods are packed and
        handed to a domestic carrier. Digital goods are delivered to the order page after
        confirmation.
      </p>
      <p>
        Guest checkout creates an order linked to the email you provide. Keep the order link to view
        payment status, tracking, or digital access details.
      </p>
      <p>
        Contact: {business.contactEmail}
        {business.phone ? ` · ${business.phone}` : ""}.
      </p>
    </LegalPage>
  );
}
