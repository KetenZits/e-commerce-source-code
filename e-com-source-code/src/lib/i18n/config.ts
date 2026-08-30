export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return value === "th" || value === "en";
}

export function localeTag(locale: Locale) {
  return locale === "th" ? "th-TH" : "en-US";
}
