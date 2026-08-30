"use client";

import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export function PrivacyActions() {
  const { t } = useI18n();
  const exportData = trpc.auth.requestDataExport.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "account-data-export.json";
      link.click();
      toast.message(t("profile.exported"));
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.auth.deleteAccount.useMutation({
    onSuccess: async () => {
      toast.message(t("profile.deleted"));
      await signOut({ callbackUrl: "/" });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button type="button" variant="outline" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
        {t("profile.export")}
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          if (window.confirm(t("profile.confirmDelete"))) remove.mutate();
        }}
        disabled={remove.isPending}
      >
        {t("profile.deleteAccount")}
      </Button>
    </div>
  );
}
