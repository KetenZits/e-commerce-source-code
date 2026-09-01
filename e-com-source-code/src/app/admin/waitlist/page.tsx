import { WaitlistTable } from "@/components/admin/waitlist-table";
import { serverCaller } from "@/trpc/server";

export default async function WaitlistPage() {
  const alerts = await (await serverCaller()).admin.stockAlerts();
  const pending = alerts.filter((alert) => !alert.notifiedAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Waitlist</h1>
        <p className="text-sm text-muted-foreground">
          {pending} waiting · {alerts.length} total. Emails send when you restock a variant and
          Resend is configured.
        </p>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No back-in-stock requests yet.</p>
      ) : (
        <WaitlistTable alerts={alerts} />
      )}
    </div>
  );
}
