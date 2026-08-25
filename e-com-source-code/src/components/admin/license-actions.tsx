"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { trpc } from "@/trpc/client";

type LicenseRow = {
  id: string;
  licenseKey: string;
  downloadCount: number;
  maxDownloads: number;
  revokedAt: Date | string | null;
  expiresAt: Date | string | null;
  user: { email: string };
  product: { title: string };
};

export function LicenseActions({ licenses }: { licenses: LicenseRow[] }) {
  const router = useRouter();
  const revoke = trpc.admin.revokeLicense.useMutation({
    onSuccess: () => {
      toast.message("License revoked");
      router.refresh();
    },
  });
  const extend = trpc.admin.extendLicense.useMutation({
    onSuccess: () => {
      toast.message("License extended by 6 months");
      router.refresh();
    },
  });

  return (
    <div className="space-y-2">
      {licenses.map((license) => {
        const revoked = Boolean(license.revokedAt);
        return (
          <div key={license.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-hair bg-surface px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm">{license.product.title}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {license.user.email} · {license.licenseKey} · {license.downloadCount}/{license.maxDownloads} downloads
              </p>
            </div>
            <StatusChip tone={revoked ? "del" : "add"}>{revoked ? "revoked" : "active"}</StatusChip>
            <Button size="sm" variant="outline" onClick={() => extend.mutate({ licenseId: license.id })}>
              Extend
            </Button>
            <Button size="sm" variant="destructive" disabled={revoked} onClick={() => revoke.mutate({ licenseId: license.id })}>
              Revoke
            </Button>
          </div>
        );
      })}
    </div>
  );
}
