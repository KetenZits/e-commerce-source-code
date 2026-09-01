import { Suspense } from "react";
import Image from "next/image";
import { CatalogBoard } from "@/components/catalog/catalog-controls";
import { Reveal } from "@/components/motion/reveal";
import { SectionDivider } from "@/components/section-divider";
import { ShippingInfo } from "@/components/shipping/shipping-info";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { catalogQuerySchema } from "@/server/schemas";
import { serverCaller } from "@/trpc/server";

type Search = {
  q?: string;
  brand?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
};

const CATALOG_HERO_IMAGE =
  "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const parsed = catalogQuerySchema.parse({
    q: raw.q ?? "",
    brand: raw.brand,
    category: raw.category,
    minPrice: raw.min ? Number(raw.min) * 100 : undefined,
    maxPrice: raw.max ? Number(raw.max) * 100 : undefined,
    sort: raw.sort,
    page: raw.page ? Number(raw.page) : 1,
  });
  const caller = await serverCaller();
  const [result, meta, storefront, { t }] = await Promise.all([
    caller.product.list(parsed),
    caller.product.filters(),
    getStorefrontConfig(),
    getI18n(),
  ]);
  const collection = meta.categories.find((category) => category.slug === parsed.category);
  const query = new URLSearchParams();
  if (raw.q) query.set("q", raw.q);
  if (raw.brand) query.set("brand", raw.brand);
  if (raw.category) query.set("category", raw.category);
  if (raw.min) query.set("min", raw.min);
  if (raw.max) query.set("max", raw.max);
  if (raw.sort) query.set("sort", raw.sort);

  const newestIds = new Set(
    parsed.page === 1 && parsed.sort === "newest"
      ? result.items.slice(0, 2).map((product) => product.id)
      : [],
  );
  const bestSellerId = result.items.find((product) => !newestIds.has(product.id))?.id;
  const items = result.items.map((product) => ({
    id: product.id,
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    images: product.images,
    minPriceCents: product.minPriceCents,
    currency: product.currency,
    inStock: product.inStock,
    variantId: product.variantId,
    basePriceCents: product.basePriceCents,
    isNew: newestIds.has(product.id),
    isBestSeller: product.id === bestSellerId,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
      <Reveal>
        <section className="grid items-end gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl leading-[1.05] md:text-6xl">
              {collection?.name ?? t("nav.shop")}
            </h1>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              {storefront.catalog.body}
            </p>
          </div>
          <div className="relative aspect-5/4 overflow-hidden rounded-2xl bg-muted">
            <Image
              src={CATALOG_HERO_IMAGE}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </section>
      </Reveal>
      <Suspense fallback={<div className="h-28 rounded-2xl bg-card" />}>
        <CatalogBoard
          categories={meta.categories.map((category) => ({
            slug: category.slug,
            name: category.name,
          }))}
          brands={meta.brands}
          total={result.total}
          items={items}
          page={result.page}
          pageCount={result.pageCount}
          queryString={query.toString()}
        />
      </Suspense>
      <SectionDivider />
      <section className="space-y-6">
        <div>
          <p className="eyebrow">
            {storefront.storeMode === "digital" ? t("nav.digitalDelivery") : t("nav.shipping")}
          </p>
          <h2 className="font-display mt-2 text-2xl">
            {storefront.storeMode === "digital"
              ? storefront.delivery.digitalTitle
              : t("catalog.beforeParcel")}
          </h2>
        </div>
        {storefront.storeMode === "digital" ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {storefront.delivery.digitalBody}
          </p>
        ) : (
          <ShippingInfo />
        )}
      </section>
    </div>
  );
}
