import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { asAttributes, productImages } from "@/lib/product";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { serverCaller } from "@/trpc/server";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await serverCaller();
  const [product, categories, storefront] = await Promise.all([
    caller.admin.productById({ id }),
    caller.admin.categories(),
    getStorefrontConfig(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Edit {product.title}</h1>
      <ProductForm
        id={product.id}
        categories={categories}
        storeMode={storefront.storeMode}
        defaultValues={{
          slug: product.slug,
          title: product.title,
          description: product.description,
          brand: product.brand,
          categoryId: product.categoryId,
          basePriceCents: product.basePriceCents,
          currency: product.currency,
          images: productImages(product.images),
          status: product.status,
          fulfillmentType: product.fulfillmentType === "DIGITAL" ? "DIGITAL" : "PHYSICAL",
          variants: product.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            attributes: asAttributes(variant.attributes),
            priceCents: variant.priceCents,
            stockQty: variant.stockQty,
            weightGrams: variant.weightGrams,
            imageUrl: variant.imageUrl ?? "",
          })),
        }}
      />
    </div>
  );
}
