import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm
        defaultValues={{
          slug: "",
          title: "",
          tagline: "A short, concrete pitch for the listing.",
          description: "Describe the archive. Buyers will also see the file tree.",
          authorName: "Sourcecode",
          priceCents: 99000,
          currency: "THB",
          techStack: ["TypeScript"],
          category: "boilerplate",
          coverLang: "ts",
          coverCode: "export function demo() {\n  return true\n}",
          demoUrl: "",
          status: "DRAFT",
          previewFiles: [{ path: "src/index.ts", language: "ts", content: "export const version = \"1.0.0\"\n" }],
        }}
      />
    </div>
  );
}
