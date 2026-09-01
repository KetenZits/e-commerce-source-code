"use client";

import type { FormEvent, SelectHTMLAttributes } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductTile, type ProductTileData } from "@/components/product/product-tile";
import { StaggerItem, StaggerRoot } from "@/components/motion/stagger";
import { useI18n } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type CatalogView = "grid" | "list";

const selectClass =
  "h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-9 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CatalogBoard({
  categories,
  brands,
  total,
  items,
  page,
  pageCount,
  queryString,
}: {
  categories: { slug: string; name: string }[];
  brands: string[];
  total: number;
  items: ProductTileData[];
  page: number;
  pageCount: number;
  queryString: string;
}) {
  const { t } = useI18n();
  const [view, setView] = useState<CatalogView>("grid");

  return (
    <div className="space-y-8">
      <CatalogFilters categories={categories} brands={brands} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total} {t("catalog.products")}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t("catalog.gridView")}
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg transition-colors",
              view === "grid"
                ? "bg-[#f3e6d4] text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("catalog.listView")}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg transition-colors",
              view === "list"
                ? "bg-[#f3e6d4] text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-card p-8 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(34,33,30,0.04)]">
          {t("catalog.empty")}
        </p>
      ) : (
        <StaggerRoot
          className={
            view === "list"
              ? "flex flex-col gap-4"
              : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          }
        >
          {items.map((product, index) => (
            <StaggerItem key={product.id}>
              <ProductTile product={product} layout={view} priority={index < 2} />
            </StaggerItem>
          ))}
        </StaggerRoot>
      )}
      {pageCount > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {Array.from({ length: pageCount }, (_, index) => {
            const nextPage = index + 1;
            const href = `/catalog?${new URLSearchParams({
              ...(queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {}),
              page: String(nextPage),
            }).toString()}`;
            return (
              <Link
                key={nextPage}
                href={href}
                className={`rounded-full px-3 py-1.5 ${nextPage === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {nextPage}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CatalogFilters({
  categories,
  brands,
}: {
  categories: { slug: string; name: string }[];
  brands: string[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [filtersOpen, setFiltersOpen] = useState(true);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
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
    next.delete("page");
    router.push(`/catalog?${next.toString()}`);
  }

  const activeCategory = params.get("category") ?? "";
  const activeBrand = params.get("brand") ?? "";

  return (
    <div className="rounded-2xl bg-card p-4 shadow-[0_10px_40px_rgba(34,33,30,0.06)] md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={params.get("q")}
            defaultValue={params.get("q") ?? ""}
            placeholder={t("catalog.searchProducts")}
            aria-label={t("catalog.searchProducts")}
            className="h-10 rounded-xl bg-background pl-9"
            onKeyDown={(event) => {
              if (event.key === "Enter") setParam("q", event.currentTarget.value || null);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:w-auto">
          <FilterSelect
            aria-label={t("catalog.filterCollection")}
            value={activeCategory}
            onChange={(event) => setParam("category", event.target.value || null)}
          >
            <option value="">{t("catalog.allCollections")}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            aria-label={t("catalog.filterBrand")}
            value={activeBrand}
            onChange={(event) => setParam("brand", event.target.value || null)}
          >
            <option value="">{t("catalog.allBrands")}</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            aria-label={t("catalog.sort")}
            value={params.get("sort") ?? "newest"}
            onChange={(event) => setParam("sort", event.target.value)}
          >
            <option value="newest">{t("catalog.sortByNewest")}</option>
            <option value="price-asc">{t("catalog.sortPriceAsc")}</option>
            <option value="price-desc">{t("catalog.sortPriceDesc")}</option>
          </FilterSelect>
          <Button
            type="button"
            variant="outline"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="h-10 rounded-xl border-border bg-background px-3 shadow-none"
          >
            <SlidersHorizontal className="size-4" />
            {t("catalog.filters")}
          </Button>
        </div>
      </div>

      {filtersOpen ? (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"
          onSubmit={applyPrice}
        >
          <label className="flex-1 text-xs text-muted-foreground">
            {t("catalog.minPrice")}
            <Input
              name="min"
              type="number"
              min="0"
              defaultValue={params.get("min") ?? ""}
              className="mt-1.5 h-10 rounded-xl font-tabular"
            />
          </label>
          <label className="flex-1 text-xs text-muted-foreground">
            {t("catalog.maxPrice")}
            <Input
              name="max"
              type="number"
              min="0"
              defaultValue={params.get("max") ?? ""}
              className="mt-1.5 h-10 rounded-xl font-tabular"
            />
          </label>
          <div className="flex items-center gap-2 pb-0.5">
            <Button type="submit" className="h-10 rounded-xl px-5">
              {t("catalog.applyPrice")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-3"
              onClick={() => router.push("/catalog")}
            >
              {t("catalog.clear")}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function FilterSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative min-w-0 lg:w-44", className)}>
      <select className={selectClass} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
