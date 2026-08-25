"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "bestselling", label: "Best-selling" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
] as const;

export function CatalogControls({
  stacks,
  categories,
  children,
}: {
  stacks: string[];
  categories: string[];
  children?: ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedStacks = params.getAll("stack");

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/catalog?${next.toString()}`);
  }

  function toggleStack(stack: string) {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll("stack");
    next.delete("stack");
    const updated = current.includes(stack) ? current.filter((item) => item !== stack) : [...current, stack];
    updated.forEach((item) => next.append("stack", item));
    router.push(`/catalog?${next.toString()}`);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="h-fit rounded-lg border border-hair bg-surface p-4 lg:w-56 lg:shrink-0">
        <p className="util-label mb-3">Filters</p>
        <div className="space-y-4">
          <div>
            <p className="util-label mb-2">Stack</p>
            <div className="space-y-1.5">
              {stacks.map((stack) => (
                <label key={stack} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedStacks.includes(stack)} onChange={() => toggleStack(stack)} />
                  <span className="font-plex text-[12px] tracking-wide">{stack}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="util-label mb-2">Category</p>
            <div className="space-y-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setParam("category", params.get("category") === category ? null : category)}
                  className={`block font-plex text-[12px] tracking-wide ${params.get("category") === category ? "text-amber" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="util-label mb-2">Price (THB)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="sr-only">Min</Label>
                <Input
                  defaultValue={params.get("min") ?? ""}
                  placeholder="min"
                  className="font-plex"
                  onBlur={(event) => setParam("min", event.target.value || null)}
                />
              </div>
              <div>
                <Label className="sr-only">Max</Label>
                <Input
                  defaultValue={params.get("max") ?? ""}
                  placeholder="max"
                  className="font-plex"
                  onBlur={(event) => setParam("max", event.target.value || null)}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            name="q"
            defaultValue={params.get("q") ?? ""}
            placeholder="Search listings"
            className="font-mono h-9 pr-16"
            onKeyDown={(event) => {
              if (event.key === "Enter") setParam("q", event.currentTarget.value || null);
            }}
          />
          <span className="font-plex pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            ⌘K
          </span>
        </div>
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-2 font-plex text-[11px] tracking-[0.08em] uppercase"
          defaultValue={params.get("sort") ?? "newest"}
          onChange={(event) => setParam("sort", event.target.value)}
        >
          {SORTS.map((sort) => (
            <option key={sort.id} value={sort.id}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>
      {children}
      </div>
    </div>
  );
}
