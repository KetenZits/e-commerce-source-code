import { PaymentSettingsForm } from "@/components/admin/payment-settings";
import { serverCaller } from "@/trpc/server";

export default async function PaymentsPage() {
  const settings = await (await serverCaller()).admin.paymentSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Payments</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          This is the PromptPay account printed on every checkout QR. In demo mode, press I&apos;ve transferred and the order is marked paid without a real bank transfer. Switch to live when you are ready to receive money on this ID.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <PaymentSettingsForm defaultValues={settings} />
      </div>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
        <li>Sign in as buyer@atelier.dev / buyer1234.</li>
        <li>Add a product to the cart and check out to the PromptPay screen.</li>
        <li>Demo: click I&apos;ve transferred. Live: scan the QR in a bank app, then click I&apos;ve transferred (and paste a slip URL if you use SlipOK / EasySlip).</li>
        <li>Open Admin → Orders if a live slip needs manual Approve.</li>
      </ol>
    </div>
  );
}
