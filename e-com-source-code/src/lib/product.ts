export type VariantAttributes = Record<string, string>;

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asAttributes(value: unknown): VariantAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string"
  );
  return Object.fromEntries(entries);
}

export function formatAttributes(value: unknown) {
  const attrs = asAttributes(value);
  return Object.entries(attrs)
    .map(([key, item]) => `${key} ${item}`)
    .join(" · ");
}

export function productImages(value: unknown): string[] {
  return asStringArray(value);
}

export function skuFrom(brand: string, title: string, attrs: VariantAttributes) {
  const base = `${brand}-${title}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const suffix = Object.values(attrs)
    .join("-")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-");
  return [base, suffix].filter(Boolean).join("-");
}
