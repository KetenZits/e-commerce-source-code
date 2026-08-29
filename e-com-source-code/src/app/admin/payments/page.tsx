import { PaymentSettingsForm } from "@/components/admin/payment-settings";
import { TaxSettingsForm } from "@/components/admin/tax-settings";
import { serverCaller } from "@/trpc/server";

export default async function PaymentsPage() {
  const caller = await serverCaller();
  const [settings, tax] = await Promise.all([
    caller.admin.paymentSettings(),
    caller.admin.taxSettings(),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Payments</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          This is the PromptPay account printed on every checkout QR. Demo mode auto-approves transfers in development only. Production always runs live.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <PaymentSettingsForm defaultValues={settings} />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display mb-4 text-xl">VAT / invoices</h2>
        <TaxSettingsForm defaultValues={tax} />
      </div>
    </div>
  );
}
