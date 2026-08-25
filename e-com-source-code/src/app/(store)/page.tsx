import Link from "next/link";
import { ProductTile } from "@/components/product/product-tile";
import { Reveal } from "@/components/motion/reveal";
import { SectionDivider } from "@/components/section-divider";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { productImages } from "@/lib/product";

const FEATURES = [
  {
    eyebrow: "Payment",
    title: "PromptPay",
    text: "Pay by QR from any Thai bank app. The parcel is packed after the transfer is verified.",
  },
  {
    eyebrow: "Dispatch",
    title: "From Bangkok",
    text: "Metro deliveries in two to four days. The rest of Thailand, four to seven.",
  },
  {
    eyebrow: "Catalog",
    title: "In stock, as photographed",
    text: "Each variant carries its own quantity. Out of stock pieces cannot be checked out.",
  },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([
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
  ]);

  const mapped = products.map((product) => ({
    ...product,
    images: productImages(product.images),
    inStock: product.variants.some((variant) => variant.stockQty > 0),
    minPriceCents: Math.min(...product.variants.map((variant) => variant.priceCents), product.basePriceCents),
  }));
  const featured = mapped.filter((product) => ["linen-overshirt", "stoneware-mug", "leather-card-case"].includes(product.slug));
  const newest = mapped.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16">
      <section className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="max-w-2xl space-y-6">
          <p className="eyebrow">Bangkok atelier</p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Goods made to be used, not displayed.</h1>
          <p className="max-w-lg text-muted-foreground leading-7">
            A small catalog of apparel, tableware, and leather — photographed as they are, priced in Thai baht, shipped from Bangkok.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/catalog" />}>
              Shop the catalog
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/#featured" />}>
              View featured
            </Button>
          </div>
        </Reveal>
        {newest[0] ? (
          <Reveal delay={120} className="hidden lg:block">
            <ProductTile product={newest[0]} />
          </Reveal>
        ) : null}
      </section>

      <SectionDivider />

      <section id="featured" className="scroll-mt-24 space-y-8">
        <Reveal>
          <p className="eyebrow">Studio edit</p>
          <h2 className="font-display mt-2 text-2xl">Featured</h2>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-3">
          {featured.map((product, index) => (
            <Reveal key={product.id} delay={index * 90}>
              <ProductTile product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      <section className="grid gap-8 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 80} className="rounded-xl border border-border bg-card p-6">
            <p className="eyebrow">{feature.eyebrow}</p>
            <h3 className="font-display mt-3 text-xl">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
          </Reveal>
        ))}
      </section>

      <SectionDivider />

      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">New in</h2>
          <Link href="/catalog" className="text-sm text-muted-foreground hover:text-primary">
            All products
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((product, index) => (
            <Reveal key={product.id} delay={index * 70}>
              <ProductTile product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Collections</h2>
          <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary">
            All collections
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 70}>
              <Link
                href={`/catalog?category=${category.slug}`}
                className="block rounded-xl border border-border bg-card p-5 transition-colors duration-300 hover:border-primary/40"
              >
                <p className="eyebrow">{category.products.length} pieces</p>
                <h3 className="font-display mt-2 text-xl">{category.name}</h3>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
