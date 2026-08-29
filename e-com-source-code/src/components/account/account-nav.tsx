"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { canAccessAdmin } from "@/lib/roles";

const LINKS = [
  { href: "/dashboard", label: "Profile", exact: true },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
];

export function AccountNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const links = canAccessAdmin(role)
    ? [...LINKS, { href: "/admin", label: "Admin" }]
    : LINKS;

  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-border pb-px">
      {links.map((link) => {
        const active = link.exact
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
