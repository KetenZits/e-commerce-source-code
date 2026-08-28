"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { StoreMode } from "@/lib/storefront-config";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/storefront", label: "Storefront" },
];

export function AdminNav({ storeMode }: { storeMode: StoreMode }) {
  const pathname = usePathname();
  const links =
    storeMode === "digital"
      ? LINKS.filter((link) => link.href !== "/admin/shipping")
      : LINKS;
  return (
    <aside className="w-full border-b border-border lg:w-48 lg:border-r lg:border-b-0">
      <div className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                active ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
