import Link from "next/link";
import { ProductTile } from "@/components/product/product-tile";
import { Reveal } from "@/components/motion/reveal";
import { StaggerItem, StaggerRoot } from "@/components/motion/stagger";
import { TiltCard } from "@/components/motion/tilt-card";
import { SectionDivider } from "@/components/section-divider";
import { db } from "@/lib/db";
import { productImages } from "@/lib/product";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";

export default async function CategoriesPage() {
  const [categories, products, storefront, { t }] = await Promise.all([
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
    getStorefrontConfig(),
    getI18n(),
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
        <Link href="/" className="hover:text-foreground">{t("categories.home")}</Link>
        <span>/</span>
        <span>{t("categories.collections")}</span>
      </nav>
      <Reveal className="max-w-2xl space-y-4 py-4">
        <p className="eyebrow">{storefront.collections.eyebrow}</p>
        <h1 className="font-display text-4xl">{storefront.collections.title}</h1>
        <p className="leading-7 text-muted-foreground">
          {storefront.collections.body}
        </p>
      </Reveal>
      <StaggerRoot className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((category) => (
          <StaggerItem key={category.id}>
            <TiltCard className="h-full" intensity={5}>
            <Link
              href={`/catalog?category=${category.slug}`}
              className="premium-depth block min-h-44 rounded-xl border border-border bg-card/90 p-6 backdrop-blur-sm"
            >
              <p className="eyebrow">{category.products.length} {t("categories.pieces")}</p>
              <h2 className="font-display mt-8 text-2xl">{category.name}</h2>
              {category.children.length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.children.map((child) => child.name).join(" · ")}
                </p>
              ) : null}
            </Link>
            </TiltCard>
          </StaggerItem>
        ))}
      </StaggerRoot>
      <SectionDivider />
      <section className="space-y-7">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">{t("categories.studio")}</p>
            <h2 className="font-display mt-2 text-2xl">{t("categories.newest")}</h2>
          </div>
          <Link href="/catalog" className="text-sm text-primary">{t("categories.shopAll")}</Link>
        </div>
        <StaggerRoot className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <StaggerItem key={product.id}>
              <ProductTile product={product} />
            </StaggerItem>
          ))}
        </StaggerRoot>
      </section>
    </div>
  );
}
