import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PurchaseSuccessIcon } from "@/components/dashboard/purchase-success-icon";
import { PurchasesTable } from "@/components/dashboard/purchases-table";
import { authOptions } from "@/server/auth";
import { serverCaller } from "@/trpc/server";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/purchases");
  const { paid } = await searchParams;
  const licenses = await (await serverCaller()).license.mine();
  const rows = licenses.map((license) => {
    const revoked = Boolean(license.revokedAt);
    const expired = Boolean(license.expiresAt && license.expiresAt < new Date());
    return {
      id: license.id,
      title: license.product.title,
      licenseKey: license.licenseKey,
      remaining: Math.max(0, license.maxDownloads - license.downloadCount),
      purchasedAt: license.createdAt.toISOString(),
      status: revoked ? "revoked" : expired ? "expired" : "active",
    } as const;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex items-center gap-4">
        {paid ? <PurchaseSuccessIcon /> : null}
        <div>
          <h1 className="text-2xl font-semibold">My purchases</h1>
          <p className="text-sm text-muted-foreground">
            {paid ? "Payment confirmed. Your license is ready." : "License keys and remaining downloads."}
          </p>
        </div>
      </div>
      {rows.length === 0 ? (
        <pre className="rounded-lg border border-hair bg-void p-6 font-mono text-sm text-muted-foreground">
          {`no purchases yet.\nbrowse the catalog, then come back here for the key.`}
        </pre>
      ) : (
        <div className="rounded-lg border border-hair bg-surface p-2">
          <PurchasesTable rows={[...rows]} />
        </div>
      )}
    </div>
  );
}
