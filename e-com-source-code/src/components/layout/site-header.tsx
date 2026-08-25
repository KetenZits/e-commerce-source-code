"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/cart/cart-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

const TABS = [
  { href: "/catalog", label: "Shop" },
  { href: "/categories", label: "Collections" },
  { href: "/shipping", label: "Shipping" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="font-display mr-4 text-lg tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative px-3 py-2 text-sm tracking-wide transition",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {active ? <span className="absolute inset-x-3 -bottom-[11px] h-px bg-primary" /> : null}
              </Link>
            );
          })}
        </nav>
        <CartButton />
        {status === "loading" ? (
          <span className="text-xs text-muted-foreground">…</span>
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
              {session.user.name ?? session.user.email}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/orders" />}>
                Orders
              </DropdownMenuItem>
              {session.user.role === "ADMIN" ? (
                <DropdownMenuItem nativeButton={false} render={<Link href="/admin" />}>
                  Admin
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/auth/signin" />}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
