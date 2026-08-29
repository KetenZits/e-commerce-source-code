import { LegalPage } from "@/components/legal/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <p>
        We store account details, addresses, order history, payment slips, and device cart cookies
        to complete checkout. PromptPay slips are kept to prevent duplicate payments.
      </p>
      <p>
        You can request an export of your data or delete the account from the privacy page once
        open orders are finished. We do not sell personal data.
      </p>
    </LegalPage>
  );
}
