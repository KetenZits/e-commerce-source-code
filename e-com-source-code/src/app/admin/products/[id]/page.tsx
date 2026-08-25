import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { asCoverSnippet, asStringArray, flattenFiles, asFileNode } from "@/lib/file-tree";
import { serverCaller } from "@/trpc/server";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await (await serverCaller()).admin.productById({ id });
  if (!product) notFound();
  const snippet = asCoverSnippet(product.coverSnippet);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit {product.title}</h1>
      <ProductForm
        id={product.id}
        defaultValues={{
          slug: product.slug,
          title: product.title,
          tagline: product.tagline,
          description: product.description,
          authorName: product.authorName,
          priceCents: product.priceCents,
          currency: product.currency,
          techStack: asStringArray(product.techStack),
          category: product.category,
          coverLang: snippet.lang,
          coverCode: snippet.code,
          demoUrl: product.demoUrl ?? "",
          status: product.status,
          previewFiles: flattenFiles(asFileNode(product.repoPreviewFiles)),
        }}
      />
    </div>
  );
}
