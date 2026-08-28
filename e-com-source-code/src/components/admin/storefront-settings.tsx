"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storefrontSettingsSchema } from "@/server/schemas";
import { trpc } from "@/trpc/client";

type Form = z.infer<typeof storefrontSettingsSchema>;

export function StorefrontSettingsForm({
  defaultValues,
}: {
  defaultValues: Form;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(storefrontSettingsSchema),
    defaultValues,
  });
  const mode = useWatch({ control: form.control, name: "storeMode" });
  const imageUrl = useWatch({ control: form.control, name: "hero.imageUrl" });
  const save = trpc.admin.saveStorefrontSettings.useMutation({
    onSuccess: () => {
      toast.message("Storefront settings saved");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  async function uploadBanner(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/admin/upload?area=marketing", {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed");
      }
      form.setValue("hero.imageUrl", result.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.message("Banner uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
    >
      <Section
        title="Store type"
        description="The current mode controls checkout, delivery messaging, and new order fulfillment. Existing orders keep their original type."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(["physical", "digital"] as const).map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-4 ${
                mode === value ? "border-primary bg-muted" : "border-border"
              }`}
            >
              <input
                type="radio"
                value={value}
                className="mr-2"
                {...form.register("storeMode")}
              />
              <span className="font-medium capitalize">{value}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {value === "physical"
                  ? "Collect a shipping address and calculate delivery fees."
                  : "Skip shipping and let admins send IDs, codes, or access details from each order."}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Brand" description="Used in navigation and browser metadata.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name">
            <Input {...form.register("siteName")} />
          </Field>
          <Field label="Tagline">
            <Input {...form.register("siteTagline")} />
          </Field>
        </div>
      </Section>

      <Section title="Home banner" description="Edit the main message, actions, and banner image. Leave the image empty to use the newest product.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <Input {...form.register("hero.eyebrow")} />
          </Field>
          <Field label="Headline">
            <Input {...form.register("hero.title")} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={4} {...form.register("hero.body")} />
          </Field>
          <Field label="Primary button">
            <Input {...form.register("hero.primaryLabel")} />
          </Field>
          <Field label="Primary link">
            <Input placeholder="/catalog" {...form.register("hero.primaryHref")} />
          </Field>
          <Field label="Secondary button">
            <Input {...form.register("hero.secondaryLabel")} />
          </Field>
          <Field label="Secondary link">
            <Input placeholder="/#featured" {...form.register("hero.secondaryHref")} />
          </Field>
          <Field label="Banner image URL" className="sm:col-span-2">
            <Input {...form.register("hero.imageUrl")} />
          </Field>
          <Field label="Upload banner" className="sm:col-span-2">
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(event) => void uploadBanner(event.target.files?.[0])}
            />
          </Field>
          {imageUrl ? (
            <div className="overflow-hidden rounded-xl border border-border sm:col-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Banner preview"
                className="max-h-72 w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Home sections" description="Headings and the three information cards shown on the home page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Featured eyebrow">
            <Input {...form.register("home.featuredEyebrow")} />
          </Field>
          <Field label="Featured title">
            <Input {...form.register("home.featuredTitle")} />
          </Field>
          <Field label="New products title">
            <Input {...form.register("home.newTitle")} />
          </Field>
          <Field label="Collections title">
            <Input {...form.register("home.collectionsTitle")} />
          </Field>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {defaultValues.home.features.map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-border p-4">
              <Field label={`Card ${index + 1} eyebrow`}>
                <Input {...form.register(`home.features.${index}.eyebrow`)} />
              </Field>
              <Field label="Title">
                <Input {...form.register(`home.features.${index}.title`)} />
              </Field>
              <Field label="Text">
                <Textarea rows={4} {...form.register(`home.features.${index}.text`)} />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Page introductions" description="Edit the headings and descriptions for your catalog and collections.">
        <div className="grid gap-6 lg:grid-cols-2">
          <PageCopy prefix="catalog" title="Catalog" form={form} />
          <PageCopy prefix="collections" title="Collections" form={form} />
        </div>
      </Section>

      <Section title="Delivery page" description="Separate content is shown for physical and digital store modes.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="font-medium">Physical mode</h3>
            <Field label="Title">
              <Input {...form.register("delivery.physicalTitle")} />
            </Field>
            <Field label="Description">
              <Textarea rows={5} {...form.register("delivery.physicalBody")} />
            </Field>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Digital mode</h3>
            <Field label="Title">
              <Input {...form.register("delivery.digitalTitle")} />
            </Field>
            <Field label="Description">
              <Textarea rows={5} {...form.register("delivery.digitalBody")} />
            </Field>
          </div>
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" disabled={save.isPending || uploading}>
          {save.isPending ? "Saving" : "Save storefront"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-1 mb-5 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function PageCopy({
  prefix,
  title,
  form,
}: {
  prefix: "catalog" | "collections";
  title: string;
  form: UseFormReturn<Form>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      <Field label="Eyebrow">
        <Input {...form.register(`${prefix}.eyebrow`)} />
      </Field>
      <Field label="Title">
        <Input {...form.register(`${prefix}.title`)} />
      </Field>
      <Field label="Description">
        <Textarea rows={5} {...form.register(`${prefix}.body`)} />
      </Field>
    </div>
  );
}
