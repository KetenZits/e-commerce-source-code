"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(params.get("token") ?? "");
  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.message("Email confirmed");
      router.push("/auth/signin");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        verify.mutate({ token });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="token">Verification token</Label>
        <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={verify.isPending}>
        Confirm
      </Button>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Confirm email</h1>
      <Suspense>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
