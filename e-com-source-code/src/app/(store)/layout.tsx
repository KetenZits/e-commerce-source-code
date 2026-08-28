import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StorefrontBackground } from "@/components/layout/storefront-background";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const storefront = await getStorefrontConfig();
  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col">
      <StorefrontBackground />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <SiteHeader
          siteName={storefront.siteName}
          storeMode={storefront.storeMode}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter
          siteName={storefront.siteName}
          storeMode={storefront.storeMode}
        />
      </div>
    </div>
  );
}
