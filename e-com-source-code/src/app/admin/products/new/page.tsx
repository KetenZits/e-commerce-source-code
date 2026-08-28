import { ProductForm } from "@/components/admin/product-form";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { serverCaller } from "@/trpc/server";

export default async function NewProductPage() {
  const [categories, storefront] = await Promise.all([
    (await serverCaller()).admin.categories(),
    getStorefrontConfig(),
  ]);
  const digital = storefront.storeMode === "digital";
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">New product</h1>
      <ProductForm
        categories={categories}
        storeMode={storefront.storeMode}
        defaultValues={{
          slug: "",
          title: "",
          description: digital
            ? "Describe the digital product, platform, region, and access requirements."
            : "Describe the piece: materials, origin, and how it should be used.",
          brand: "Atelier",
          categoryId: categories[0]?.id ?? "",
          basePriceCents: 99000,
          currency: "THB",
          images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80"],
          status: "DRAFT",
          variants: [
            {
              sku: digital ? "ATL-DIGI-PC-GLB" : "ATL-NEW-M-NAT",
              attributes: digital
                ? { size: "PC", color: "Global" }
                : { size: "M", color: "Natural" },
              priceCents: 99000,
              stockQty: 0,
              weightGrams: digital ? 0 : 400,
              imageUrl: "",
            },
          ],
        }}
      />
    </div>
  );
}
