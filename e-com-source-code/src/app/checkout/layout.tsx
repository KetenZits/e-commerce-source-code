import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-xl items-center px-4">
          <Link href="/" className="font-display text-lg">
            {SITE_NAME}
          </Link>
          <span className="ml-auto text-xs tracking-[0.14em] text-muted-foreground uppercase">checkout</span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
