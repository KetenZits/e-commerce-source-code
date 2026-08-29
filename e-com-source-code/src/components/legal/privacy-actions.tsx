"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function PrivacyActions() {
  const router = useRouter();
  const exportData = trpc.auth.requestDataExport.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "atelier-data-export.json";
      link.click();
      toast.message("Export downloaded");
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.message("Account deleted");
      router.push("/");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button type="button" variant="outline" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
        Export my data
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          if (window.confirm("Delete this account? This cannot be undone.")) remove.mutate();
        }}
        disabled={remove.isPending}
      >
        Delete account
      </Button>
    </div>
  );
}
