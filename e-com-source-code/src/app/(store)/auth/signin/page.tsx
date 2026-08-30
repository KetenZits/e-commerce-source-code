import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { hasGoogleOAuth } from "@/lib/env";
import { getI18n } from "@/lib/i18n/get-locale";

export default async function SignInPage() {
  const { t } = await getI18n();

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("auth.signInTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("auth.signInHint")}</p>
      <Suspense>
        <SignInForm google={hasGoogleOAuth()} />
      </Suspense>
    </div>
  );
}
