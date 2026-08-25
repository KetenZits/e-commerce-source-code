import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hair">
      <div className="font-plex mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        <span>
          {SITE_NAME} · licenses, not subscriptions
        </span>
        <Link href="/sell" className="hover:text-amber">
          Sell your code
        </Link>
      </div>
    </footer>
  );
}
