"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
  { href: "/catalog", label: "Catalog" },
  { href: "/categories", label: "Categories" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-void/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-4">
        <Link href="/" className="font-heading mr-4 text-sm font-semibold tracking-tight text-foreground">
          {SITE_NAME}
          <span className="text-amber">.</span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-end gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "font-plex relative px-3 py-3 text-[11px] tracking-[0.14em] uppercase transition",
                  active ? "text-amber" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {active ? <span className="absolute inset-x-2 -bottom-px h-0.5 bg-amber" /> : null}
              </Link>
            );
          })}
        </nav>
        {status === "loading" ? (
          <span className="font-plex text-[10px] tracking-[0.14em] text-muted-foreground uppercase">session</span>
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="font-plex tracking-[0.08em]" />}>
              {session.user.name ?? session.user.email}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/purchases" />}>
                My purchases
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
