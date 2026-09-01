import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { th } from "date-fns/locale/th";
import type { Locale } from "@/lib/i18n/config";

function dfLocale(locale?: Locale) {
  return locale === "th" ? th : enUS;
}

export function toDate(value: Date | string | number) {
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }
  const date = new Date(value);
  return isValid(date) ? date : null;
}

export function formatDate(
  value: Date | string | number,
  pattern = "d MMM yyyy",
  locale?: Locale,
) {
  const date = toDate(value);
  return date ? format(date, pattern, { locale: dfLocale(locale) }) : "—";
}

export function formatDateTime(value: Date | string | number, locale?: Locale) {
  return formatDate(value, "d MMM yyyy, HH:mm", locale);
}

export function formatRelative(value: Date | string | number, locale?: Locale) {
  const date = toDate(value);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: dfLocale(locale) });
}

export function formatChartTick(isoDate: string, period: "daily" | "weekly") {
  const date = toDate(isoDate);
  if (!date) return isoDate;
  return format(date, period === "weekly" ? "'w/c' d MMM" : "d MMM");
}
