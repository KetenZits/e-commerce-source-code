"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Revenue" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/licenses", label: "Licenses" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="w-full border-b border-hair lg:w-48 lg:border-r lg:border-b-0">
      <div className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-plex rounded-sm px-3 py-2 text-[11px] tracking-[0.14em] uppercase",
                active ? "bg-elevated text-amber" : "text-muted-foreground hover:text-foreground"
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
