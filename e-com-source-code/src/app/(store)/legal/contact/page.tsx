import { LegalPage } from "@/components/legal/legal-page";
import { PrivacyActions } from "@/components/legal/privacy-actions";

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <p>
        Atelier · Bangkok. Write to the store from the email on your order, or use the account
        tools below to export or delete your data.
      </p>
      <PrivacyActions />
    </LegalPage>
  );
}
