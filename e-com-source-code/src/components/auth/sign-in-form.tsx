"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/server/schemas";
import type { z } from "zod";
import Link from "next/link";

type Form = z.infer<typeof signInSchema>;

export function SignInForm({ google }: { google: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [pending, setPending] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setPending(true);
        const result = await signIn("credentials", { ...values, redirect: false, callbackUrl });
        setPending(false);
        if (result?.error) {
          toast.error("Email or password does not match.");
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      })}
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </Button>
      {google ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl })}>
          Continue with Google
        </Button>
      ) : null}
      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/auth/register" className="text-amber">
          Create one
        </Link>
      </p>
    </form>
  );
}
