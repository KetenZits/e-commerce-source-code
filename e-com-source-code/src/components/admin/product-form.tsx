"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CodeCard } from "@/components/product/code-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/constants";
import { productFormSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";
import type { z } from "zod";

type Form = z.infer<typeof productFormSchema>;

export function ProductForm({
  id,
  defaultValues,
}: {
  id?: string;
  defaultValues: Form;
}) {
  const router = useRouter();
  const form = useForm<Form>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });
  const files = useFieldArray({ control: form.control, name: "previewFiles" });
  const values = form.watch();
  const save = trpc.admin.upsertProduct.useMutation({
    onSuccess: (product) => {
      toast.message("Product saved");
      router.push("/admin/products");
      router.refresh();
      return product;
    },
    onError: (error) => toast.error(error.message),
  });

  const preview = useMemo(
    () => ({
      slug: values.slug || "untitled",
      title: values.title || "untitled",
      techStack: values.techStack ?? [],
      coverSnippet: { code: values.coverCode || "// snippet", lang: values.coverLang || "ts" },
      priceCents: values.priceCents || 0,
      currency: values.currency || "THB",
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [values]
  );

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
      onSubmit={form.handleSubmit((data) => save.mutate({ id, ...data }))}
    >
      <div className="space-y-4">
        <Field label="Title">
          <Input {...form.register("title")} />
        </Field>
        <Field label="Slug">
          <Input {...form.register("slug")} className="font-mono" />
        </Field>
        <Field label="Tagline">
          <Input {...form.register("tagline")} />
        </Field>
        <Field label="Description">
          <Textarea {...form.register("description")} className="min-h-40" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Author">
            <Input {...form.register("authorName")} />
          </Field>
          <Field label="Price (satang)">
            <Input type="number" {...form.register("priceCents", { valueAsNumber: true })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <select className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm" {...form.register("category")}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
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
        <Field label="Tech stack (comma-separated)">
          <Input
            defaultValue={(defaultValues.techStack ?? []).join(", ")}
            onBlur={(event) =>
              form.setValue(
                "techStack",
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />
        </Field>
        <Field label="Cover language">
          <Input {...form.register("coverLang")} />
        </Field>
        <Field label="Cover snippet">
          <Textarea {...form.register("coverCode")} className="font-mono min-h-28" />
        </Field>
        <div className="space-y-2">
          <p className="util-label">Preview files</p>
          {files.fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-lg border border-hair p-3">
              <Input placeholder="path" {...form.register(`previewFiles.${index}.path`)} className="font-mono" />
              <Input placeholder="language" {...form.register(`previewFiles.${index}.language`)} />
              <Textarea placeholder="content" {...form.register(`previewFiles.${index}.content`)} className="font-mono" />
              <Button type="button" variant="ghost" size="sm" onClick={() => files.remove(index)}>
                Remove file
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => files.append({ path: "src/index.ts", language: "ts", content: "export {}" })}
          >
            Add file
          </Button>
        </div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving" : "Save product"}
        </Button>
      </div>
      <div className="space-y-3 lg:sticky lg:top-16">
        <p className="util-label">Live card preview</p>
        <CodeCard product={preview} />
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
