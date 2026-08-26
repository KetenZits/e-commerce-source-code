import Link from "next/link";
import { ProductTile } from "@/components/product/product-tile";
import { Reveal } from "@/components/motion/reveal";
import { SectionDivider } from "@/components/section-divider";
import { db } from "@/lib/db";
import { productImages } from "@/lib/product";

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    db.category.findMany({
      include: { children: true, parent: true, products: { where: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const roots = categories.filter((category) => !category.parentId);
  const featured = products.map((product) => ({
    ...product,
    images: productImages(product.images),
    inStock: product.variants.some((variant) => variant.stockQty > 0),
    minPriceCents: Math.min(
      ...product.variants.map((variant) => variant.priceCents),
      product.basePriceCents
    ),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span>Collections</span>
      </nav>
      <Reveal className="max-w-2xl space-y-4 py-4">
        <p className="eyebrow">The collection</p>
        <h1 className="font-display text-4xl">Useful pieces, considered slowly.</h1>
        <p className="leading-7 text-muted-foreground">
          Our collections group material, purpose, and maker rather than seasons.
          Each piece is selected to settle naturally into everyday routines.
        </p>
      </Reveal>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((category, index) => (
          <Reveal key={category.id} delay={index * 70}>
            <Link
              href={`/catalog?category=${category.slug}`}
              className="block min-h-44 rounded-xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/40"
            >
              <p className="eyebrow">{category.products.length} pieces</p>
              <h2 className="font-display mt-8 text-2xl">{category.name}</h2>
              {category.children.length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.children.map((child) => child.name).join(" · ")}
                </p>
              ) : null}
            </Link>
          </Reveal>
        ))}
      </div>
      <SectionDivider />
      <section className="space-y-7">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Across the studio</p>
            <h2 className="font-display mt-2 text-2xl">Newest pieces</h2>
          </div>
          <Link href="/catalog" className="text-sm text-primary">Shop all</Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductTile key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
