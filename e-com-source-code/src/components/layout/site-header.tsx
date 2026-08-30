"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/cart/cart-button";
import { MobileMenuVisual } from "@/components/layout/mobile-menu-visual";
import { NavSearch } from "@/components/layout/nav-search";
import StaggeredMenu from "@/components/reactbits/StaggeredMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/locale-provider";
import { SITE_NAME } from "@/lib/constants";
import { canAccessAdmin } from "@/lib/roles";
import type { StoreMode } from "@/lib/storefront-config";

export function SiteHeader({
  siteName = SITE_NAME,
  storeMode = "physical",
  navImages = [],
}: {
  siteName?: string;
  storeMode?: StoreMode;
  navImages?: string[];
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [closeVersion, setCloseVersion] = useState(0);
  const closeMobileMenu = useCallback(
    () => setCloseVersion((version) => version + 1),
    [],
  );
  const tabs = [
    { href: "/catalog", label: t("nav.shop") },
    { href: "/categories", label: t("nav.collections") },
    { href: "/#featured", label: t("nav.featured") },
    { href: "/wishlist", label: t("nav.wishlist") },
    {
      href: "/shipping",
      label: storeMode === "digital" ? t("nav.digitalDelivery") : t("nav.shipping"),
    },
  ];
  const menuItems = tabs.map((tab) => ({
    label: tab.label,
    ariaLabel: `${t("nav.goTo")} ${tab.label}`,
    link: tab.href,
  }));

  return (
    <header className="relative z-40 h-16 min-[821px]:sticky min-[821px]:top-0 min-[821px]:border-b min-[821px]:border-border/80 min-[821px]:bg-background/85 min-[821px]:backdrop-blur-xl">
      <div className="min-[821px]:hidden">
        <StaggeredMenu
          position="right"
          items={menuItems}
          displaySocials={false}
          displayItemNumbering
          logoText={siteName}
          isFixed
          colors={["var(--brass)", "var(--primary)"]}
          accentColor="var(--brass)"
          menuButtonColor="var(--foreground)"
          openMenuButtonColor="var(--foreground)"
          closeSignal={`${pathname}:${closeVersion}`}
          onMenuOpen={() => setMobileMenuOpen(true)}
          onMenuClose={() => setMobileMenuOpen(false)}
          headerActions={<CartButton />}
          panelVisual={
            mobileMenuOpen ? (
              <MobileMenuVisual images={navImages} storeMode={storeMode} />
            ) : null
          }
          panelFooter={
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <NavSearch onSubmit={closeMobileMenu} />
                <LanguageSwitcher />
              </div>
              {status === "loading" ? (
                <p className="text-xs text-muted-foreground">
                  {t("nav.loading")}
                </p>
              ) : session?.user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/dashboard" />}
                    onClick={closeMobileMenu}
                  >
                    {t("nav.account")}
                  </Button>
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/dashboard/orders" />}
                    onClick={closeMobileMenu}
                  >
                    {t("nav.orders")}
                  </Button>
                  {canAccessAdmin(session.user.role) ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href="/admin" />}
                      onClick={closeMobileMenu}
                    >
                      {t("nav.admin")}
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    className="col-span-2"
                    onClick={() => {
                      closeMobileMenu();
                      void signOut({ callbackUrl: "/" });
                    }}
                  >
                    {t("nav.signOut")}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/auth/signin" />}
                  onClick={closeMobileMenu}
                >
                  {t("nav.signIn")}
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="mx-auto hidden h-16 max-w-6xl items-center gap-3 px-4 min-[821px]:flex">
        <Link href="/" className="font-display mr-1 flex items-center gap-2 text-lg tracking-tight">
          <span className="size-1.5 rotate-45 bg-brass" aria-hidden />
          {siteName}
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1">
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
        <div className="ml-auto flex items-center gap-2">
          <NavSearch />
          <LanguageSwitcher />
        </div>
        <CartButton />
        {status === "loading" ? (
          <span className="text-xs text-muted-foreground">…</span>
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2 pl-1.5" />}>
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="size-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] tracking-wide">
                  {(session.user.name ?? session.user.email ?? "A").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="max-w-36 truncate">
                {session.user.name ?? session.user.email}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard" />}>
                {t("nav.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/orders" />}>
                {t("nav.orders")}
              </DropdownMenuItem>
              <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/addresses" />}>
                {t("nav.addresses")}
              </DropdownMenuItem>
              {canAccessAdmin(session.user.role) ? (
                <DropdownMenuItem nativeButton={false} render={<Link href="/admin" />}>
                  {t("nav.admin")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>{t("nav.signOut")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/auth/signin" />}>
            {t("nav.signIn")}
          </Button>
        )}
      </div>
    </header>
  );
}
