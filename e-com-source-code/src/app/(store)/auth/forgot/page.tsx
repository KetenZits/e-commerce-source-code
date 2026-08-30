"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const request = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => toast.message(t("auth.resetSent")),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("auth.reset")}</h1>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          request.mutate({ email });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={request.isPending}>
          {t("auth.sendReset")}
        </Button>
      </form>
    </div>
  );
}
