import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { hasGoogleOAuth } from "@/lib/env";

export default function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-muted-foreground">Sign in to check out and follow your orders.</p>
      <Suspense>
        <SignInForm google={hasGoogleOAuth()} />
      </Suspense>
    </div>
  );
}
