"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function CatalogControls({
  categories,
  brands,
  children,
}: {
  categories: { slug: string; name: string }[];
  brands: string[];
  children: ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/catalog?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-10 lg:flex-row">
      <aside className="h-fit w-full rounded-xl border border-border bg-card p-5 lg:w-56">
        <p className="eyebrow mb-4">Filter</p>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Collection</p>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setParam("category", params.get("category") === category.slug ? null : category.slug)}
                  className={`block text-sm ${params.get("category") === category.slug ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Brand</p>
            <div className="space-y-1">
              {brands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setParam("brand", params.get("brand") === brand ? null : brand)}
                  className={`block text-sm ${params.get("brand") === brand ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Input
            defaultValue={params.get("q") ?? ""}
            placeholder="Search"
            className="h-9"
            onKeyDown={(event) => {
              if (event.key === "Enter") setParam("q", event.currentTarget.value || null);
            }}
          />
          <select
            className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
            defaultValue={params.get("sort") ?? "newest"}
            onChange={(event) => setParam("sort", event.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </div>
        {children}
      </div>
    </div>
  );
}
