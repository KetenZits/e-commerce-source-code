"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const request = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => toast.message("If that account exists, a reset email is on its way."),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          request.mutate({ email });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={request.isPending}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}
