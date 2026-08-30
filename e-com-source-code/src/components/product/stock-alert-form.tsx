"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export function StockAlertForm({ variantId }: { variantId: string }) {
  const { t } = useI18n();
  const alert = trpc.product.createStockAlert.useMutation({
    onSuccess: () => toast.message(t("stockAlert.saved")),
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "");
        alert.mutate({ variantId, email });
      }}
    >
      <p className="text-sm">{t("stockAlert.hint")}</p>
      <Input name="email" type="email" required placeholder={t("stockAlert.emailPlaceholder")} />
      <Button type="submit" size="sm" disabled={alert.isPending}>
        {alert.isPending ? t("stockAlert.saving") : t("stockAlert.notify")}
      </Button>
    </form>
  );
}
