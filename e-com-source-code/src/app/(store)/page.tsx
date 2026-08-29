import Link from "next/link";
import { HomeHero } from "@/components/home/home-hero";
import { ProductTile } from "@/components/product/product-tile";
import { ProductMarquee } from "@/components/product/product-marquee";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { Reveal } from "@/components/motion/reveal";
import { StaggerItem, StaggerRoot } from "@/components/motion/stagger";
import { TiltCard } from "@/components/motion/tilt-card";
import { SectionDivider } from "@/components/section-divider";
import { db } from "@/lib/db";
import { productImages } from "@/lib/product";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function HomePage() {
  const [products, categories, storefront] = await Promise.all([
    db.product.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      where: { parentId: null },
      include: { products: { where: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
    }),
    getStorefrontConfig(),
  ]);

  const mapped = products.map((product) => ({
    ...product,
    images: productImages(product.images),
    inStock: product.variants.some((variant) => variant.stockQty > 0),
    minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
  }));
  const featured = mapped.slice(0, 3);
  const newest = mapped.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-16">
      <HomeHero product={newest[0]} content={storefront.hero} />

      <section className="space-y-5" aria-labelledby="moving-collection">
        <Reveal>
          <p className="eyebrow">Explore in motion</p>
          <h2 id="moving-collection" className="font-display mt-2 text-2xl">
            Across the collection
          </h2>
        </Reveal>
        <ProductMarquee products={mapped} />
      </section>

      <SectionDivider />

      <section id="featured" className="scroll-mt-24 space-y-8">
        <Reveal>
          <p className="eyebrow">{storefront.home.featuredEyebrow}</p>
          <h2 className="font-display mt-2 text-2xl">{storefront.home.featuredTitle}</h2>
        </Reveal>
        <StaggerRoot className="grid gap-x-6 gap-y-10 md:grid-cols-3">
          {featured.map((product) => (
            <StaggerItem key={product.id}>
              <ProductTile product={product} />
            </StaggerItem>
          ))}
        </StaggerRoot>
      </section>

      <SectionDivider />

      <StaggerRoot className="grid gap-8 md:grid-cols-3">
        {storefront.home.features.map((feature) => (
          <StaggerItem key={feature.title}>
            <TiltCard className="h-full">
          <article className="premium-depth h-full rounded-xl border border-border bg-card/90 p-6 backdrop-blur-sm">
            <p className="eyebrow">{feature.eyebrow}</p>
            <h3 className="font-display mt-3 text-xl">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
          </article>
            </TiltCard>
          </StaggerItem>
        ))}
      </StaggerRoot>

      <SectionDivider />

      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">{storefront.home.newTitle}</h2>
          <Link href="/catalog" className="text-sm text-muted-foreground hover:text-primary">
            All products
          </Link>
        </div>
        <StaggerRoot className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((product) => (
            <StaggerItem key={product.id}>
              <ProductTile product={product} />
            </StaggerItem>
          ))}
        </StaggerRoot>
      </section>

      <SectionDivider />

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">{storefront.home.collectionsTitle}</h2>
          <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary">
            All collections
          </Link>
        </div>
        <StaggerRoot className="grid gap-4 sm:grid-cols-3">
          {categories.map((category) => (
            <StaggerItem key={category.id}>
              <TiltCard className="h-full" intensity={5}>
              <Link
                href={`/catalog?category=${category.slug}`}
                className="premium-depth block h-full rounded-xl border border-border bg-card/90 p-5 backdrop-blur-sm"
              >
                <p className="eyebrow">{category.products.length} pieces</p>
                <h3 className="font-display mt-2 text-xl">{category.name}</h3>
              </Link>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerRoot>
      </section>

      <RecentlyViewed />
    </div>
  );
}
