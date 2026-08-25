import { ProductForm } from "@/components/admin/product-form";
import { serverCaller } from "@/trpc/server";

export default async function NewProductPage() {
  const categories = await (await serverCaller()).admin.categories();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">New product</h1>
      <ProductForm
        categories={categories}
        defaultValues={{
          slug: "",
          title: "",
          description: "Describe the piece: materials, origin, and how it should be used.",
          brand: "Atelier",
          categoryId: categories[0]?.id ?? "",
          basePriceCents: 99000,
          currency: "THB",
          images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80"],
          status: "DRAFT",
          variants: [
            {
              sku: "ATL-NEW-M-NAT",
              attributes: { size: "M", color: "Natural" },
              priceCents: 99000,
              stockQty: 0,
              weightGrams: 400,
              imageUrl: "",
            },
          ],
        }}
      />
    </div>
  );
}
