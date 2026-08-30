"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";

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
  const { t } = useI18n();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/catalog?${next.toString()}`);
  }

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams(params.toString());
    const min = String(data.get("min") ?? "").trim();
    const max = String(data.get("max") ?? "").trim();
    if (min) next.set("min", min);
    else next.delete("min");
    if (max) next.set("max", max);
    else next.delete("max");
    router.push(`/catalog?${next.toString()}`);
  }

  const activeCategory = params.get("category") ?? "";
  const activeBrand = params.get("brand") ?? "";

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <Input
            key={params.get("q")}
            defaultValue={params.get("q") ?? ""}
            placeholder={t("catalog.searchProducts")}
            className="h-9"
            onKeyDown={(event) => {
              if (event.key === "Enter") setParam("q", event.currentTarget.value || null);
            }}
          />
          <select
            aria-label={t("catalog.filterCollection")}
            className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
            value={activeCategory}
            onChange={(event) => setParam("category", event.target.value || null)}
          >
            <option value="">{t("catalog.allCollections")}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t("catalog.filterBrand")}
            className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
            value={activeBrand}
            onChange={(event) => setParam("brand", event.target.value || null)}
          >
            <option value="">{t("catalog.allBrands")}</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          <select
            aria-label={t("catalog.sort")}
            className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
            value={params.get("sort") ?? "newest"}
            onChange={(event) => setParam("sort", event.target.value)}
          >
            <option value="newest">{t("catalog.sortNewest")}</option>
            <option value="price-asc">{t("catalog.sortPriceAsc")}</option>
            <option value="price-desc">{t("catalog.sortPriceDesc")}</option>
          </select>
        </div>
        <form
          className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-end"
          onSubmit={applyPrice}
        >
          <label className="flex-1 text-xs text-muted-foreground">
            {t("catalog.minPrice")}
            <Input
              name="min"
              type="number"
              min="0"
              defaultValue={params.get("min") ?? ""}
              className="mt-1 h-9 font-tabular"
            />
          </label>
          <label className="flex-1 text-xs text-muted-foreground">
            {t("catalog.maxPrice")}
            <Input
              name="max"
              type="number"
              min="0"
              defaultValue={params.get("max") ?? ""}
              className="mt-1 h-9 font-tabular"
            />
          </label>
          <Button type="submit" variant="outline">
            {t("catalog.applyPrice")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/catalog")}
          >
            {t("catalog.clear")}
          </Button>
        </form>
      </div>
      {children}
    </div>
  );
}
