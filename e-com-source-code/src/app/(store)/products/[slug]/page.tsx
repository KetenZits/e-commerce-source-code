import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductMarquee } from "@/components/product/product-marquee";
import { ReviewForm } from "@/components/product/review-form";
import { RecentlyViewed, TrackRecentlyViewed } from "@/components/product/recently-viewed";
import { Reveal } from "@/components/motion/reveal";
import { SectionDivider } from "@/components/section-divider";
import { formatMoney } from "@/lib/money";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { serverCaller } from "@/trpc/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await (await serverCaller()).product.bySlug({ slug });
  if (!product) return { title: "Product" };
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.seoTitle || product.title,
      description: product.seoDescription || product.description.slice(0, 160),
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await serverCaller();
  const [product, storefront, { t }] = await Promise.all([
    caller.product.bySlug({ slug }),
    getStorefrontConfig(),
    getI18n(),
  ]);
  if (!product) notFound();
  const related = await caller.product.related({
    categoryId: product.categoryId,
    excludeId: product.id,
  });
  const inStock = product.variants.some(
    (variant) => variant.stockQty - variant.reservedQty > 0,
  );
  const minPrice = Math.min(...product.variants.map((variant) => variant.priceCents));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <TrackRecentlyViewed
        product={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand,
          images: product.images,
          minPriceCents: minPrice,
          currency: product.currency,
          inStock,
        }}
      />
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/">{t("product.home")}</Link>
        <span>/</span>
        <Link href={`/catalog?category=${product.category.slug}`}>{product.category.name}</Link>
        <span>/</span>
        <span>{product.title}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-3">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{product.brand}</p>
          <ProductGallery productId={product.id} title={product.title} images={product.images} />
          <div className="flex items-start justify-between gap-6 pt-2">
            <h1 className="font-display text-3xl">{product.title}</h1>
            <p className="font-tabular shrink-0 text-lg">{formatMoney(minPrice, product.currency)}</p>
          </div>
        </section>
        <Reveal className="lg:sticky lg:top-24 lg:self-start lg:pt-8">
        <aside className="space-y-6">
          {!inStock ? (
            <p className="text-sm text-destructive">{t("product.outOfStock")}</p>
          ) : (
            <p className="text-xs tracking-[0.14em] text-primary uppercase">
              {storefront.storeMode === "digital"
                ? t("product.digitalDelivery")
                : t("product.readyToShip")}
            </p>
          )}
          <p className="leading-7 text-muted-foreground">{product.description}</p>
          <SectionDivider />
          <AddToCart variants={product.variants} />
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
            <span>{t("product.promptpay")}</span>
            <span className="text-right">
              {product.fulfillmentType === "DIGITAL" || storefront.storeMode === "digital"
                ? t("product.secureAccess")
                : t("product.trackedDelivery")}
            </span>
          </div>
        </aside>
        </Reveal>
      </div>
      {product.reviews.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl">{t("product.reviews")}</h2>
          <p className="text-sm text-muted-foreground">
            {product.rating?.toFixed(1)} / 5 · {product.reviewCount} {t("product.reviewCount")}
          </p>
          <div className="space-y-3">
            {product.reviews.map((review) => (
              <article key={review.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium">
                  {review.user.name ?? t("product.customer")} · {review.rating}/5
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <ReviewForm productId={product.id} />
      {related.length > 1 ? (
        <>
          <SectionDivider />
          <section className="space-y-5" aria-labelledby="related-products">
            <Reveal>
              <p className="eyebrow">{t("product.keepExploring")}</p>
              <h2 id="related-products" className="font-display mt-2 text-2xl">
                {t("product.moreFrom")}
              </h2>
            </Reveal>
            <ProductMarquee products={related} />
          </section>
        </>
      ) : null}
      <RecentlyViewed excludeId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.description,
            image: product.images,
            brand: product.brand,
            offers: {
              "@type": "Offer",
              priceCurrency: product.currency,
              price: (minPrice / 100).toFixed(2),
              availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
    </div>
  );
}
