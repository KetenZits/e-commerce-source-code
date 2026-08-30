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
import { useI18n } from "@/components/i18n/locale-provider";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type Form = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const registerUser = trpc.auth.register.useMutation();
  const form = useForm<Form>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("auth.createTitle")}</h1>
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
              toast.error(t("auth.createdSignIn"));
              router.push("/auth/signin");
              return;
            }
            router.push("/");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("auth.createFail"));
          } finally {
            setPending(false);
          }
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.name")}</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" type="password" {...form.register("password")} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("auth.creating") : t("auth.createAccount")}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link href="/auth/signin" className="text-primary">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
