import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/constants";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-hair">
        <div className="mx-auto flex h-12 max-w-xl items-center px-4">
          <Link href="/" className="font-heading text-sm font-semibold">
            {SITE_NAME}
            <span className="text-amber">.</span>
          </Link>
          <span className="font-plex ml-auto text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            checkout
          </span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
