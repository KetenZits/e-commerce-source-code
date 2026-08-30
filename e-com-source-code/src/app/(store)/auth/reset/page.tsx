"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";

function ResetForm() {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.message(t("profile.passwordUpdated"));
      router.push("/auth/signin");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        reset.mutate({ token, password });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="token">{t("auth.resetToken")}</Label>
        <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.newPassword")}</Label>
        <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={reset.isPending}>
        {t("profile.updatePassword")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("auth.choosePassword")}</h1>
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
