import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { hasGoogleOAuth } from "@/lib/env";

export default function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="font-mono text-sm text-muted-foreground">Use the same email you want the license bound to.</p>
      <Suspense>
        <SignInForm google={hasGoogleOAuth()} />
      </Suspense>
    </div>
  );
}
