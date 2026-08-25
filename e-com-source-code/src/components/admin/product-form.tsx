"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { asAttributes } from "@/lib/product";
import { productFormSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type Form = z.infer<typeof productFormSchema>;

export function ProductForm({
  id,
  categories,
  defaultValues,
}: {
  id?: string;
  categories: { id: string; name: string }[];
  defaultValues: Form;
}) {
  const router = useRouter();
  const form = useForm<Form>({ resolver: zodResolver(productFormSchema), defaultValues });
  const variants = useFieldArray({ control: form.control, name: "variants" });
  const images = form.watch("images");
  const [sizes, setSizes] = useState(() => uniqueAttr(defaultValues.variants, "size").join(", ") || "S, M, L");
  const [colors, setColors] = useState(() => uniqueAttr(defaultValues.variants, "color").join(", ") || "Natural, Ink");
  const [uploading, setUploading] = useState(false);
  const save = trpc.admin.upsertProduct.useMutation({
    onSuccess: () => {
      toast.message("Product saved");
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.set("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: data });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
        urls.push(json.url);
      }
      form.setValue("images", [...form.getValues("images"), ...urls], { shouldValidate: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function generateMatrix() {
    const sizeList = splitList(sizes);
    const colorList = splitList(colors);
    if (sizeList.length === 0 && colorList.length === 0) {
      toast.error("Enter at least one size or color");
      return;
    }
    const current = form.getValues("variants");
    const next =
      sizeList.length && colorList.length
        ? sizeList.flatMap((size) => colorList.map((color) => findOrCreate(current, { size, color }, form.getValues("basePriceCents"))))
        : sizeList.length
          ? sizeList.map((size) => findOrCreate(current, { size }, form.getValues("basePriceCents")))
          : colorList.map((color) => findOrCreate(current, { color }, form.getValues("basePriceCents")));
    form.setValue("variants", next);
    variants.replace(next);
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((data) => save.mutate({ id, ...data }))}>
      <Field label="Title">
        <Input {...form.register("title")} />
      </Field>
      <Field label="Slug">
        <Input {...form.register("slug")} className="font-tabular" />
      </Field>
      <Field label="Brand">
        <Input {...form.register("brand")} />
      </Field>
      <Field label="Description">
        <Textarea {...form.register("description")} className="min-h-32" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" {...form.register("categoryId")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" {...form.register("status")}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </Field>
      </div>
      <Field label="Base price (satang)">
        <Input type="number" className="font-tabular" {...form.register("basePriceCents", { valueAsNumber: true })} />
      </Field>
      <Field label="Product photos">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src) => (
            <div key={src} className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 rounded-md bg-card px-1.5 text-xs text-destructive"
                onClick={() => form.setValue("images", images.filter((item) => item !== src), { shouldValidate: true })}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <Input className="mt-2" type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => uploadImages(event.target.files)} />
        <p className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload to R2, or local /uploads in development."}</p>
        <Textarea
          className="mt-2 min-h-20 font-tabular text-xs"
          value={images.join("\n")}
          onChange={(event) =>
            form.setValue(
              "images",
              event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
              { shouldValidate: true }
            )
          }
        />
      </Field>
      <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="eyebrow">Variant matrix</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Sizes">
            <Input value={sizes} onChange={(event) => setSizes(event.target.value)} placeholder="S, M, L" />
          </Field>
          <Field label="Colors">
            <Input value={colors} onChange={(event) => setColors(event.target.value)} placeholder="Natural, Ink" />
          </Field>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={generateMatrix}>
          Generate size × color grid
        </Button>
        {variants.fields.map((field, index) => {
          const attrs = asAttributes(form.getValues(`variants.${index}.attributes`));
          return (
            <div key={field.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-3">
              <Input placeholder="SKU" className="font-tabular" {...form.register(`variants.${index}.sku`)} />
              <Input
                placeholder="Size"
                defaultValue={attrs.size ?? ""}
                onBlur={(event) => {
                  const current = asAttributes(form.getValues(`variants.${index}.attributes`));
                  form.setValue(`variants.${index}.attributes`, compactAttrs({ ...current, size: event.target.value }));
                }}
              />
              <Input
                placeholder="Color"
                defaultValue={attrs.color ?? ""}
                onBlur={(event) => {
                  const current = asAttributes(form.getValues(`variants.${index}.attributes`));
                  form.setValue(`variants.${index}.attributes`, compactAttrs({ ...current, color: event.target.value }));
                }}
              />
              <Input type="number" placeholder="Price satang" className="font-tabular" {...form.register(`variants.${index}.priceCents`, { valueAsNumber: true })} />
              <Input type="number" placeholder="Stock" className="font-tabular" {...form.register(`variants.${index}.stockQty`, { valueAsNumber: true })} />
              <Input type="number" placeholder="Weight grams" className="font-tabular" {...form.register(`variants.${index}.weightGrams`, { valueAsNumber: true })} />
              <div className="sm:col-span-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => variants.remove(index)}>
                  Remove variant
                </Button>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            variants.append({
              sku: "NEW-SKU",
              attributes: { size: "M", color: "Natural" },
              priceCents: form.getValues("basePriceCents") || 10000,
              stockQty: 0,
              weightGrams: 200,
              imageUrl: "",
            })
          }
        >
          Add variant
        </Button>
      </div>
      <input type="hidden" {...form.register("currency")} />
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving" : "Save product"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueAttr(variants: Form["variants"], key: string) {
  return [...new Set(variants.map((variant) => asAttributes(variant.attributes)[key]).filter(Boolean))];
}

function compactAttrs(attrs: Record<string, string>) {
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value.trim()));
}

function findOrCreate(current: Form["variants"], attributes: Record<string, string>, basePriceCents: number): Form["variants"][number] {
  const match = current.find((variant) => {
    const attrs = asAttributes(variant.attributes);
    return Object.entries(attributes).every(([key, value]) => attrs[key] === value);
  });
  if (match) return { ...match, attributes: { ...asAttributes(match.attributes), ...attributes } };
  const sku = ["ATL", ...Object.values(attributes)].join("-").toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return {
    sku,
    attributes,
    priceCents: basePriceCents || 10000,
    stockQty: 0,
    weightGrams: 200,
    imageUrl: "",
  };
}
