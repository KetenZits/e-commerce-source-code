import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function ContactPage() {
  const store = await getStorefrontConfig();
  const { business, siteName } = store;
  const name = business.legalName || siteName;

  return (
    <LegalPage title="Contact">
      <p>
        {name} · {business.city}, {business.country}
      </p>
      <p>{business.address}</p>
      <p>
        Email {business.contactEmail}
        {business.phone ? ` · ${business.phone}` : ""}.
      </p>
      <p>
        Account data export and deletion are on the{" "}
        <Link href="/legal/privacy" className="text-primary">
          privacy page
        </Link>
        .
      </p>
    </LegalPage>
  );
}
