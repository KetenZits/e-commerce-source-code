import Link from "next/link";
import { getI18n } from "@/lib/i18n/get-locale";

export async function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { t } = await getI18n();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p className="eyebrow">{t("legal.eyebrow")}</p>
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="space-y-4 text-sm leading-7 text-muted-foreground">{children}</div>
      <p className="text-xs">
        <Link href="/legal/contact" className="text-primary">
          {t("legal.contact")}
        </Link>
      </p>
    </div>
  );
}
