import Link from "next/link";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getI18n } from "@/lib/i18n/get-locale";

export default async function WishlistPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-6xl space-y-9 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">{t("wishlist.home")}</Link>
        <span>/</span>
        <span>{t("wishlist.title")}</span>
      </nav>
      <div>
        <p className="eyebrow">{t("wishlist.eyebrow")}</p>
        <h1 className="font-display mt-2 text-4xl">{t("wishlist.title")}</h1>
      </div>
      <WishlistView />
    </div>
  );
}
