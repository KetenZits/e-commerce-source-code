import type { ReactNode } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SITE_NAME } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/get-locale";

export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  const { t } = await getI18n();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
          <Link href="/" className="font-display text-lg">
            {SITE_NAME}
          </Link>
          <span className="ml-auto text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {t("checkout.title")}
          </span>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
