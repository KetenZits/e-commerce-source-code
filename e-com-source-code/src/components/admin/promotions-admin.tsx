"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";

export function PromotionsAdmin({
  promotions,
}: {
  promotions: {
    id: string;
    code: string;
    name: string;
    type: string;
    value: number;
    active: boolean;
    usageCount: number;
    usageLimit: number | null;
  }[];
}) {
  const router = useRouter();
  const save = trpc.admin.upsertPromotion.useMutation({
    onSuccess: () => {
      toast.message("Promotion saved");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          save.mutate({
            code: String(data.get("code") ?? ""),
            name: String(data.get("name") ?? ""),
            type: data.get("type") === "FIXED" ? "FIXED" : "PERCENTAGE",
            value: Number(data.get("value") ?? 0),
            minSubtotalCents: 0,
            active: true,
          });
        }}
      >
        <Input name="code" placeholder="CODE" required />
        <Input name="name" placeholder="Name" required />
        <select name="type" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="PERCENTAGE">Percentage (basis points, 1000 = 10%)</option>
          <option value="FIXED">Fixed satang</option>
        </select>
        <Input name="value" type="number" placeholder="Value" required className="font-tabular" />
        <Button type="submit" disabled={save.isPending}>
          Save promotion
        </Button>
      </form>
      <div className="space-y-2">
        {promotions.map((promo) => (
          <div key={promo.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="font-tabular">{promo.code}</p>
            <p className="text-muted-foreground">
              {promo.name} · {promo.type} {promo.value} · used {promo.usageCount}
              {promo.usageLimit ? `/${promo.usageLimit}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
