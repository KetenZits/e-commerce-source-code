import { notFound } from "next/navigation";
import { BuyButton } from "@/components/product/buy-button";
import { ProductPreview } from "@/components/product/product-preview";
import { StatusChip } from "@/components/ui/status-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { asStringArray } from "@/lib/file-tree";
import { formatMoney } from "@/lib/money";
import { serverCaller } from "@/trpc/server";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await (await serverCaller()).product.bySlug({ slug });
  if (!product) notFound();
  const stack = asStringArray(product.techStack);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.title}</h1>
          <p className="font-plex text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            by {product.authorName} · {product.salesCount} sales
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{product.tagline}</p>
        </header>

        <Tabs defaultValue="preview">
          <TabsList variant="line" className="font-plex tracking-[0.08em] uppercase">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tree">File tree</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <article className="max-w-2xl space-y-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
              {product.description}
            </article>
          </TabsContent>
          <TabsContent value="tree" className="pt-4">
            <ProductPreview tree={product.repoPreviewFiles} />
          </TabsContent>
          <TabsContent value="preview" className="pt-4">
            <ProductPreview tree={product.repoPreviewFiles} />
          </TabsContent>
          <TabsContent value="changelog" className="pt-4 font-mono text-sm text-muted-foreground">
            Updates included for 6 months from the purchase date.
          </TabsContent>
        </Tabs>
      </div>

      <aside className="h-fit space-y-4 rounded-lg border border-hair bg-surface p-4 lg:sticky lg:top-16">
        <p className="font-heading text-2xl text-amber">{formatMoney(product.priceCents, product.currency)}</p>
        <BuyButton productId={product.id} className="w-full" />
        <p className="util-label">Stack</p>
        <p className="font-plex text-[12px] tracking-wide text-muted-foreground">{stack.join(" · ")}</p>
        <p className="util-label">Includes</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>full source archive</li>
          <li>6 months of updates</li>
          <li>license key bound to your account</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <StatusChip tone="add">verified payment</StatusChip>
          <StatusChip tone="amber">promptpay</StatusChip>
        </div>
      </aside>
    </div>
  );
}
