"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

export function StockAlertForm({ variantId }: { variantId: string }) {
  const alert = trpc.product.createStockAlert.useMutation({
    onSuccess: () => toast.message("We will email you if this returns to stock."),
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
      <p className="text-sm">Email me if this variant is back in stock.</p>
      <Input name="email" type="email" required placeholder="you@example.com" />
      <Button type="submit" size="sm" disabled={alert.isPending}>
        {alert.isPending ? "Saving" : "Notify me"}
      </Button>
    </form>
  );
}
