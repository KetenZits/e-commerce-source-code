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
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs tracking-[0.12em] text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-t border-border">
                  <td className="px-3 py-2">{alert.email}</td>
                  <td className="px-3 py-2">{alert.product.title}</td>
                  <td className="font-tabular px-3 py-2">{alert.variant.sku}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {alert.notifiedAt ? "Emailed" : "Waiting"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
