import Link from "next/link";
import { SectionDivider } from "@/components/section-divider";
import { SITE_NAME } from "@/lib/constants";
import type { StoreMode } from "@/lib/storefront-config";

export function SiteFooter({
  siteName = SITE_NAME,
  storeMode = "physical",
}: {
  siteName?: string;
  storeMode?: StoreMode;
}) {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <SectionDivider className="mb-8" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{siteName} · Bangkok</span>
          <div className="flex gap-4">
            <Link href="/categories" className="hover:text-foreground">
              Collections
            </Link>
            <Link href="/#featured" className="hover:text-foreground">
              Featured
            </Link>
            <Link href="/shipping" className="hover:text-foreground">
              {storeMode === "digital" ? "Digital delivery" : "Shipping"}
            </Link>
            <Link href="/catalog" className="hover:text-foreground">
              Shop
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
