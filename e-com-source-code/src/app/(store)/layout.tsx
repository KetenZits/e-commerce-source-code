import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StorefrontBackground } from "@/components/layout/storefront-background";
import { db } from "@/lib/db";
import { productImages } from "@/lib/product";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const [storefront, navProducts] = await Promise.all([
    getStorefrontConfig(),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { images: true },
      take: 6,
    }),
  ]);
  const navImages = Array.from(
    new Set(
      navProducts.flatMap((product) => productImages(product.images).slice(0, 1)),
    ),
  );

  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col">
      <StorefrontBackground />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <SiteHeader
          siteName={storefront.siteName}
          storeMode={storefront.storeMode}
          navImages={navImages}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter
          siteName={storefront.siteName}
          storeMode={storefront.storeMode}
          city={storefront.business.city}
          legalName={storefront.business.legalName}
        />
      </div>
    </div>
  );
}
