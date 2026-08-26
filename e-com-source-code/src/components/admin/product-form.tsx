"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bahtToSatang, formatMoney } from "@/lib/money";
import { asAttributes } from "@/lib/product";
import { productFormSchema, variantInputSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";

type BackendForm = z.infer<typeof productFormSchema>;

const editorVariantSchema = variantInputSchema
  .omit({ priceCents: true })
  .extend({ priceBaht: z.number().positive() });

const editorSchema = productFormSchema
  .omit({ basePriceCents: true, variants: true })
  .extend({
    basePriceBaht: z.number().positive(),
    variants: z.array(editorVariantSchema).min(1),
  });

type EditorForm = z.infer<typeof editorSchema>;

const STEPS = ["Basic info", "Images", "Price & stock", "Variants"] as const;

export function ProductForm({
  id,
  categories,
  defaultValues,
}: {
  id?: string;
  categories: { id: string; name: string }[];
  defaultValues: BackendForm;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [sizes, setSizes] = useState(
    () => uniqueAttr(defaultValues.variants, "size").join(", ") || "S, M, L"
  );
  const [colors, setColors] = useState(
    () => uniqueAttr(defaultValues.variants, "color").join(", ") || "Natural, Ink"
  );
  const [uploading, setUploading] = useState(false);
  const restored = useRef(false);
  const form = useForm<EditorForm>({
    resolver: zodResolver(editorSchema),
    defaultValues: toEditor(defaultValues),
  });
  const variants = useFieldArray({ control: form.control, name: "variants" });
  const preview = useWatch({ control: form.control });
  const images = useWatch({ control: form.control, name: "images" }) ?? [];

  const draft = trpc.admin.productDraft.useQuery(undefined, { enabled: !id });
  const saveDraft = trpc.admin.saveProductDraft.useMutation();
  const save = trpc.admin.upsertProduct.useMutation({
    onSuccess: () => {
      toast.message("Product saved");
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (id || restored.current || !draft.isFetched) return;
    restored.current = true;
    const parsed = editorSchema.safeParse(draft.data?.data);
    if (parsed.success) {
      form.reset(parsed.data);
      variants.replace(parsed.data.variants);
      toast.message("Draft restored");
    }
  }, [draft.data, draft.isFetched, form, id, variants]);

  const draftSnapshot = JSON.stringify(preview);
  useEffect(() => {
    if (id || !draft.isFetched || !restored.current) return;
    const timer = window.setTimeout(() => {
      const clean = JSON.parse(draftSnapshot) as Record<string, unknown>;
      saveDraft.mutate({ data: clean });
    }, 800);
    return () => window.clearTimeout(timer);
    // The serialized snapshot changes only when a form field changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.isFetched, draftSnapshot, id]);

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
      form.setValue("images", [...form.getValues("images"), ...urls], {
        shouldValidate: true,
      });
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
    const price = form.getValues("basePriceBaht");
    const next =
      sizeList.length && colorList.length
        ? sizeList.flatMap((size) =>
            colorList.map((color) => findOrCreate(current, { size, color }, price))
          )
        : sizeList.length
          ? sizeList.map((size) => findOrCreate(current, { size }, price))
          : colorList.map((color) => findOrCreate(current, { color }, price));
    variants.replace(next);
  }

  function submit(data: EditorForm) {
    save.mutate({
      id,
      ...data,
      basePriceCents: bahtToSatang(data.basePriceBaht),
      variants: data.variants.map(({ priceBaht, ...variant }) => ({
        ...variant,
        priceCents: bahtToSatang(priceBaht),
      })),
    });
  }

  return (
    <form
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]"
      onSubmit={form.handleSubmit(submit, () => toast.error("Check the highlighted fields."))}
    >
      <div className="min-w-0 space-y-5">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-3">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm ${
                step === index ? "bg-muted text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="font-tabular mr-2 text-xs">{index + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={step}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            {step === 0 ? (
              <div className="space-y-4">
                <SectionTitle title="Basic information" text="Name, describe, and place the product in the catalog." />
                <Field label="Title" error={form.formState.errors.title?.message}>
                  <Input
                    {...form.register("title")}
                    onBlur={(event) => {
                      if (!form.getValues("slug")) {
                        form.setValue("slug", slugify(event.target.value), { shouldValidate: true });
                      }
                    }}
                  />
                </Field>
                <Field label="Slug" error={form.formState.errors.slug?.message}>
                  <Input {...form.register("slug")} className="font-tabular" />
                </Field>
                <Field label="Brand" error={form.formState.errors.brand?.message}>
                  <Input {...form.register("brand")} />
                </Field>
                <Field label="Description" error={form.formState.errors.description?.message}>
                  <Textarea {...form.register("description")} className="min-h-36" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Category">
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                      {...form.register("categoryId")}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                      {...form.register("status")}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </Field>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <SectionTitle title="Product images" text="The first photo is used as the primary catalog image." />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((src) => (
                    <div key={src} className="relative overflow-hidden rounded-xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-md bg-card px-1.5 py-1 text-xs text-destructive"
                        onClick={() =>
                          form.setValue(
                            "images",
                            images.filter((item) => item !== src),
                            { shouldValidate: true }
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={(event) => uploadImages(event.target.files)}
                />
                <p className="text-xs text-muted-foreground">
                  {uploading ? "Uploading…" : "Upload to R2, or local /uploads in development."}
                </p>
                <Field label="Image URLs (one per line)" error={form.formState.errors.images?.message}>
                  <Textarea
                    className="min-h-24 font-tabular text-xs"
                    value={images.join("\n")}
                    onChange={(event) =>
                      form.setValue(
                        "images",
                        event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                        { shouldValidate: true }
                      )
                    }
                  />
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <SectionTitle title="Price and stock" text="Enter customer-facing prices directly in Thai baht." />
                <Field label="Base price (฿)" error={form.formState.errors.basePriceBaht?.message}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="font-tabular"
                    {...form.register("basePriceBaht", { valueAsNumber: true })}
                  />
                </Field>
                <Field label="Currency">
                  <Input {...form.register("currency")} className="font-tabular" />
                </Field>
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Stock, weight, and any variant-specific prices are edited in the next step.
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <SectionTitle title="Variants" text="Generate a size × color matrix, then set price and stock per SKU." />
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
                <div className="space-y-3">
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
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price ฿"
                          className="font-tabular"
                          {...form.register(`variants.${index}.priceBaht`, { valueAsNumber: true })}
                        />
                        <Input
                          type="number"
                          placeholder="Stock"
                          className="font-tabular"
                          {...form.register(`variants.${index}.stockQty`, { valueAsNumber: true })}
                        />
                        <Input
                          type="number"
                          placeholder="Weight grams"
                          className="font-tabular"
                          {...form.register(`variants.${index}.weightGrams`, { valueAsNumber: true })}
                        />
                        <Input
                          placeholder="Variant image URL (optional)"
                          className="sm:col-span-2"
                          {...form.register(`variants.${index}.imageUrl`)}
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => variants.remove(index)}>
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    variants.append({
                      sku: "NEW-SKU",
                      attributes: { size: "M", color: "Natural" },
                      priceBaht: form.getValues("basePriceBaht") || 100,
                      stockQty: 0,
                      weightGrams: 200,
                      imageUrl: "",
                    })
                  }
                >
                  Add variant
                </Button>
              </div>
            ) : null}
          </motion.section>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {id ? "Changes save when submitted." : saveDraft.isPending ? "Saving draft…" : "Draft auto-saved"}
          </p>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((current) => current + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving" : "Save product"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <aside className="h-fit xl:sticky xl:top-24">
        <p className="eyebrow mb-3">Live preview</p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative aspect-[4/5] bg-muted">
            {preview.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.images[0]} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">Add a product image</div>
            )}
            {!preview.variants?.some((variant) => (variant?.stockQty ?? 0) > 0) ? (
              <span className="absolute top-3 left-3 rounded-md border border-destructive/30 bg-card px-2 py-1 text-[10px] tracking-[0.14em] text-destructive uppercase">
                Out of stock
              </span>
            ) : null}
          </div>
          <div className="space-y-1 p-4">
            <p className="eyebrow">{preview.brand || "Brand"}</p>
            <h3 className="font-display text-lg">{preview.title || "Product title"}</h3>
            <p className="font-tabular text-right text-sm text-brass">
              {formatMoney(bahtToSatang(preview.basePriceBaht ?? 0))}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function toEditor(form: BackendForm): EditorForm {
  return {
    ...form,
    basePriceBaht: form.basePriceCents / 100,
    variants: form.variants.map(({ priceCents, ...variant }) => ({
      ...variant,
      priceBaht: priceCents / 100,
    })),
  };
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function uniqueAttr(variants: BackendForm["variants"], key: string) {
  return [...new Set(variants.map((variant) => asAttributes(variant.attributes)[key]).filter(Boolean))];
}

function compactAttrs(attrs: Record<string, string>) {
  return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value.trim()));
}

function findOrCreate(
  current: EditorForm["variants"],
  attributes: Record<string, string>,
  basePriceBaht: number
): EditorForm["variants"][number] {
  const match = current.find((variant) => {
    const attrs = asAttributes(variant.attributes);
    return Object.entries(attributes).every(([key, value]) => attrs[key] === value);
  });
  if (match) return { ...match, attributes: { ...asAttributes(match.attributes), ...attributes } };
  return {
    sku: ["ATL", ...Object.values(attributes)].join("-").toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
    attributes,
    priceBaht: basePriceBaht || 100,
    stockQty: 0,
    weightGrams: 200,
    imageUrl: "",
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
