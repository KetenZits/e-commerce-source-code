import Link from "next/link";
import { db } from "@/lib/db";
import { asStringArray } from "@/lib/file-tree";

export default async function CategoriesPage() {
  const products = await db.product.findMany({
    where: { status: "PUBLISHED" },
    select: { category: true, techStack: true },
  });
  const categories = [...new Set(products.map((product) => product.category))];
  const stacks = [...new Set(products.flatMap((product) => asStringArray(product.techStack)))];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-semibold">Categories</h1>
      <section className="space-y-3">
        <h2 className="util-label">By category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/catalog?category=${encodeURIComponent(category)}`}
              className="rounded-sm border border-hair bg-surface px-3 py-2 font-plex text-[11px] tracking-[0.12em] uppercase hover:text-amber"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="util-label">By stack</h2>
        <div className="flex flex-wrap gap-2">
          {stacks.map((stack) => (
            <Link
              key={stack}
              href={`/catalog?stack=${encodeURIComponent(stack)}`}
              className="rounded-sm border border-hair bg-surface px-3 py-2 font-plex text-[11px] tracking-[0.12em] uppercase hover:text-amber"
            >
              {stack}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
