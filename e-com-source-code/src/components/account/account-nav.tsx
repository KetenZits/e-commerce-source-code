"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { canAccessAdmin } from "@/lib/roles";
import { useI18n } from "@/components/i18n/locale-provider";

export function AccountNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = [
    { href: "/dashboard", label: t("account.profile"), exact: true },
    { href: "/dashboard/orders", label: t("account.orders") },
    { href: "/dashboard/addresses", label: t("account.addresses") },
    { href: "/wishlist", label: t("account.wishlist") },
    ...(canAccessAdmin(role) ? [{ href: "/admin", label: t("account.admin") }] : []),
  ];

  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-border pb-px">
      {links.map((link) => {
        const exact = "exact" in link && link.exact;
        const active = exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm",
              active
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
