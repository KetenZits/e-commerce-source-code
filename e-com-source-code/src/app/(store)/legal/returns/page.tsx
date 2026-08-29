import { LegalPage } from "@/components/legal/legal-page";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function ReturnsPage() {
  const store = await getStorefrontConfig();
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title="Returns">
      <p>
        Return window for unused physical goods is {business.returnDays} day
        {business.returnDays === 1 ? "" : "s"} from delivery, unless a longer period is required by
        law. Edit this number in Admin → Storefront → Business.
      </p>
      <p>
        Digital codes and delivered access details cannot be reversed once revealed, except where
        required by law. Refunds from {name} go back to the original PromptPay account after
        approval. Stock is restored when the return is accepted.
      </p>
      <p>Start a return at {business.contactEmail}.</p>
    </LegalPage>
  );
}
