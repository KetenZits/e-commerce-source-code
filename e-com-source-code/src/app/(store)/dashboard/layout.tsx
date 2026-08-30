import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getI18n } from "@/lib/i18n/get-locale";
import { authOptions } from "@/server/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard");
  const { t } = await getI18n();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="eyebrow">{t("account.title")}</p>
      <AccountNav role={session.user.role} />
      <div className="mt-8">{children}</div>
    </div>
  );
}
