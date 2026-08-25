import Link from "next/link";
import { recencyBorder, recencyLabel, recencyOf, type Recency } from "@/lib/recency";
import { asCoverSnippet, asStringArray } from "@/lib/file-tree";
import { formatMoney } from "@/lib/money";
import { highlightSnippet } from "@/lib/highlight";
import { cn } from "@/lib/utils";

export type CodeCardProduct = {
  slug: string;
  title: string;
  techStack: unknown;
  coverSnippet: unknown;
  priceCents: number;
  currency: string;
  salesCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function CodeCard({
  product,
  href,
  className,
}: {
  product: CodeCardProduct;
  href?: string;
  className?: string;
}) {
  const snippet = asCoverSnippet(product.coverSnippet);
  const stack = asStringArray(product.techStack);
  const recency: Recency = recencyOf(new Date(product.createdAt), new Date(product.updatedAt));
  const html = highlightSnippet(snippet.code, snippet.lang);
  const inner = (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-hair bg-surface transition hover:-translate-y-0.5 hover:border-amber/30",
        recencyBorder[recency],
        "border-t-2",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-hair px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="size-2 rounded-full bg-[#ff5f56]" />
          <span className="size-2 rounded-full bg-[#ffbd2e]" />
          <span className="size-2 rounded-full bg-[#27c93f]" />
        </span>
        <span className="font-plex truncate text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {product.title}.{snippet.lang}
        </span>
        <span className="font-plex ml-auto text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {recencyLabel[recency]}
        </span>
      </div>
      <pre className="min-h-[92px] flex-1 overflow-hidden bg-void px-3 py-3 font-mono text-[11px] leading-5 text-foreground/90">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
      <div className="font-plex flex items-center gap-2 border-t border-hair px-3 py-2 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
        <span className="truncate">{stack.slice(0, 3).join(" · ")}</span>
        <span className="ml-auto text-amber">{formatMoney(product.priceCents, product.currency)}</span>
        <span>{product.salesCount} sales</span>
      </div>
    </article>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block h-full" aria-label={product.title}>
      {inner}
    </Link>
  );
}
