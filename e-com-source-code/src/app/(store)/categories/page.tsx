import Link from "next/link";
import { db } from "@/lib/db";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: { children: true, parent: true, products: { where: { status: "PUBLISHED" } } },
    orderBy: { name: "asc" },
  });
  const roots = categories.filter((category) => !category.parentId);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <h1 className="font-display text-3xl">Collections</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((category) => (
          <Link
            key={category.id}
            href={`/catalog?category=${category.slug}`}
            className="block rounded-xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/40"
          >
            <p className="eyebrow">{category.products.length} pieces</p>
            <h2 className="font-display mt-2 text-2xl">{category.name}</h2>
            {category.children.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {category.children.map((child) => child.name).join(" · ")}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
