import Link from "next/link";
import { SectionDivider } from "@/components/section-divider";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <SectionDivider className="mb-8" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{SITE_NAME} · Bangkok</span>
          <div className="flex gap-4">
            <Link href="/categories" className="hover:text-foreground">
              Collections
            </Link>
            <Link href="/#featured" className="hover:text-foreground">
              Featured
            </Link>
            <Link href="/shipping" className="hover:text-foreground">
              Shipping
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
