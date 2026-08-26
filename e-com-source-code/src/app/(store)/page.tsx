import Link from "next/link";
import { HomeHero } from "@/components/home/home-hero";
import { ProductTile } from "@/components/product/product-tile";
import { Reveal } from "@/components/motion/reveal";
import { SectionDivider } from "@/components/section-divider";
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
  const featured = mapped.slice(0, 3);
  const newest = mapped.slice(0, 4);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-16">
      <HomeHero product={newest[0]} />

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
