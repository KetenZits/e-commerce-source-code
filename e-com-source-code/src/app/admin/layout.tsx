import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { canAccessAdmin } from "@/lib/roles";
import { authOptions } from "@/server/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin");
  if (!canAccessAdmin(session.user.role)) redirect("/");
  const storefront = await getStorefrontConfig();

  return (
    <>
      <SiteHeader
        siteName={storefront.siteName}
        storeMode={storefront.storeMode}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:flex-row">
        <AdminNav storeMode={storefront.storeMode} />
        <div className="min-w-0 flex-1 px-4 py-8">{children}</div>
      </div>
    </>
  );
}
