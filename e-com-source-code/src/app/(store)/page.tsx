import Link from "next/link";
import { TerminalHero } from "@/components/home/terminal-hero";
import { CodeCard } from "@/components/product/code-card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { asStringArray } from "@/lib/file-tree";

export default async function HomePage() {
  const [count, featured, published] = await Promise.all([
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { salesCount: "desc" },
      take: 3,
    }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      select: { techStack: true },
    }),
  ]);

  const stacks = [...new Set(published.flatMap((product) => asStringArray(product.techStack)))].slice(0, 8);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <TerminalHero count={count} />
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/catalog" />}>
              Browse catalog
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/sell" />}>
              Sell your code →
            </Button>
          </div>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          This is not a screenshot store. Every listing opens a file tree and a read-only editor so you can evaluate the code before you pay.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Featured</h2>
          <Link href="/catalog" className="font-plex text-[10px] tracking-[0.14em] text-muted-foreground uppercase hover:text-amber">
            All listings
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((product) => (
            <CodeCard key={product.id} product={product} href={`/products/${product.slug}`} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Browse by stack</h2>
        <div className="flex flex-wrap gap-2">
          {stacks.map((stack) => (
            <Link
              key={stack}
              href={`/catalog?stack=${encodeURIComponent(stack)}`}
              className="font-plex rounded-sm border border-hair bg-surface px-3 py-1.5 text-[11px] tracking-[0.12em] text-muted-foreground uppercase hover:border-amber/40 hover:text-amber"
            >
              {stack}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 border-t border-hair pt-10 md:grid-cols-3">
        {[
          {
            title: "See the file tree before you pay.",
            body: "Preview is a real explorer plus Monaco, not a marketing carousel.",
          },
          {
            title: "Every license is yours, no re-sale tracking spyware.",
            body: "A key bound to you and the product. Downloads are signed and capped.",
          },
          {
            title: "Updates included for 6 months.",
            body: "The license window is on the receipt. Extend it from the same key.",
          },
        ].map((item) => (
          <div key={item.title} className="space-y-2">
            <h3 className="text-sm font-semibold leading-snug">{item.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
