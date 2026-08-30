import Link from "next/link";
import { SectionDivider } from "@/components/section-divider";
import { SITE_NAME } from "@/lib/constants";
import { getI18n } from "@/lib/i18n/get-locale";
import type { StorefrontConfig } from "@/lib/storefront-defaults";

export async function SiteFooter({
  siteName = SITE_NAME,
  storeMode = "physical",
  city = "Bangkok",
  legalName,
}: {
  siteName?: string;
  storeMode?: StorefrontConfig["storeMode"];
  city?: string;
  legalName?: string;
}) {
  const { t } = await getI18n();

  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <SectionDivider className="mb-8" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            {legalName || siteName} · {city}
          </span>
          <div className="flex flex-wrap gap-4">
            <Link href="/categories" className="hover:text-foreground">
              {t("footer.collections")}
            </Link>
            <Link href="/#featured" className="hover:text-foreground">
              {t("footer.featured")}
            </Link>
            <Link href="/shipping" className="hover:text-foreground">
              {storeMode === "digital" ? t("nav.digitalDelivery") : t("footer.shipping")}
            </Link>
            <Link href="/catalog" className="hover:text-foreground">
              {t("footer.shop")}
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href="/legal/returns" className="hover:text-foreground">
              {t("footer.returns")}
            </Link>
            <Link href="/legal/contact" className="hover:text-foreground">
              {t("footer.contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
