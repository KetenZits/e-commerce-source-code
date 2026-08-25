import { LicenseActions } from "@/components/admin/license-actions";
import { serverCaller } from "@/trpc/server";

export default async function AdminLicensesPage() {
  const licenses = await (await serverCaller()).admin.licenses();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Licenses</h1>
      {licenses.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground">No licenses yet.</p>
      ) : (
        <LicenseActions licenses={licenses} />
      )}
    </div>
  );
}
