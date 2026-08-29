"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { taxSettingsSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Form = z.infer<typeof taxSettingsSchema>;

export function TaxSettingsForm({ defaultValues }: { defaultValues: Form }) {
  const router = useRouter();
  const form = useForm<Form>({ resolver: zodResolver(taxSettingsSchema), defaultValues });
  const save = trpc.admin.saveTaxSettings.useMutation({
    onSuccess: () => {
      toast.message("Tax settings saved");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit((data) => save.mutate(data))}>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("enabled")} />
        Charge VAT
      </label>
      <div className="space-y-1.5">
        <Label>Rate (basis points, 700 = 7%)</Label>
        <Input type="number" className="font-tabular" {...form.register("rateBps", { valueAsNumber: true })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("inclusive")} />
        Prices include VAT
      </label>
      <div className="space-y-1.5">
        <Label>Business name</Label>
        <Input {...form.register("businessName")} />
      </div>
      <div className="space-y-1.5">
        <Label>Tax ID</Label>
        <Input className="font-tabular" {...form.register("taxId")} />
      </div>
      <div className="space-y-1.5">
        <Label>Address on invoices</Label>
        <Input {...form.register("address")} />
      </div>
      <Button type="submit" disabled={save.isPending}>
        Save tax settings
      </Button>
    </form>
  );
}
