"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentSettingsSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type Form = z.infer<typeof paymentSettingsSchema>;

export function PaymentSettingsForm({ defaultValues }: { defaultValues: Form }) {
  const router = useRouter();
  const form = useForm<Form>({ resolver: zodResolver(paymentSettingsSchema), defaultValues });
  const save = trpc.admin.savePaymentSettings.useMutation({
    onSuccess: () => {
      toast.message("Payment account saved");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit((data) => save.mutate(data))}>
      <div className="space-y-1.5">
        <Label htmlFor="accountName">Account name on the QR</Label>
        <Input id="accountName" {...form.register("accountName")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="promptpayId">PromptPay ID</Label>
        <Input id="promptpayId" className="font-tabular" inputMode="numeric" {...form.register("promptpayId")} />
        <p className="text-xs text-muted-foreground">Thai mobile number or 13-digit national ID, digits only. No dashes.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="paymentMode">Mode</Label>
        <select
          id="paymentMode"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          {...form.register("paymentMode")}
        >
          <option value="demo">Demo — I&apos;ve transferred auto-approves</option>
          <option value="live">Live — real PromptPay, slip must verify or be approved</option>
        </select>
      </div>
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving" : "Save payment account"}
      </Button>
    </form>
  );
}
