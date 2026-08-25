import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/product/add-to-cart";
import { SectionDivider } from "@/components/section-divider";
import { formatMoney } from "@/lib/money";
import { serverCaller } from "@/trpc/server";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await (await serverCaller()).product.bySlug({ slug });
  if (!product) notFound();
  const inStock = product.variants.some((variant) => variant.stockQty > 0);
  const minPrice = Math.min(...product.variants.map((variant) => variant.priceCents));

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 lg:grid-cols-2">
      <div className="space-y-4">
        {product.images.map((src) => (
          <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-muted">
            <Image src={src} alt={product.title} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        ))}
      </div>
      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <p className="eyebrow">{product.brand}</p>
        <h1 className="font-display text-4xl">{product.title}</h1>
        <p className="font-tabular text-xl text-brass">{formatMoney(minPrice, product.currency)}</p>
        {!inStock ? <p className="text-sm text-destructive">Out of stock</p> : null}
        <p className="leading-7 text-muted-foreground">{product.description}</p>
        <SectionDivider />
        <AddToCart variants={product.variants} />
      </div>
    </div>
  );
}
