"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type Form = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const registerUser = trpc.auth.register.useMutation();
  const form = useForm<Form>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          setPending(true);
          try {
            await registerUser.mutateAsync(values);
            const result = await signIn("credentials", {
              email: values.email,
              password: values.password,
              redirect: false,
            });
            if (result?.error) {
              toast.error("Account created. Sign in from the next screen.");
              router.push("/auth/signin");
              return;
            }
            router.push("/");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create the account.");
          } finally {
            setPending(false);
          }
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...form.register("password")} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account" : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
