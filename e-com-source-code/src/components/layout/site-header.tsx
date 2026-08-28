"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/cart/cart-button";
import { NavSearch } from "@/components/layout/nav-search";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import type { StoreMode } from "@/lib/storefront-config";
import { useState } from "react";

const BASE_TABS = [
  { href: "/catalog", label: "Shop" },
  { href: "/categories", label: "Collections" },
  { href: "/#featured", label: "Featured" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/shipping", label: "Shipping" },
];

export function SiteHeader({
  siteName = SITE_NAME,
  storeMode = "physical",
}: {
  siteName?: string;
  storeMode?: StoreMode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const tabs = BASE_TABS.map((tab) =>
    tab.href === "/shipping"
      ? { ...tab, label: storeMode === "digital" ? "Digital delivery" : "Shipping" }
      : tab,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="font-display mr-1 flex items-center gap-2 text-lg tracking-tight">
          <span className="size-1.5 rotate-45 bg-brass" aria-hidden />
          {siteName}
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
          {tabs.map((tab) => {
            const active =
              tab.href === "/#featured"
                ? false
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "nav-link relative px-3 py-2 text-sm tracking-wide",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn("nav-underline", active && "is-active")} />
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <NavSearch />
        </div>
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="ghost" size="sm" className="md:hidden" />}>
            <Menu className="size-4" />
            <span className="sr-only">Menu</span>
          </DialogTrigger>
          <DialogContent className="fixed top-0 right-0 left-auto h-full max-h-none w-72 max-w-none translate-x-0 translate-y-0 rounded-none border-y-0 border-l border-border sm:max-w-none">
            <DialogHeader>
              <DialogTitle className="font-display">{siteName}</DialogTitle>
              <DialogDescription className="sr-only">Store navigation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <NavSearch onSubmit={() => setOpen(false)} />
              <nav className="flex flex-col gap-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2 text-sm hover:bg-muted"
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
