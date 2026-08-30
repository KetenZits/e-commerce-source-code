"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/config";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "EN" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={cn("inline-flex items-center rounded-full border border-border p-0.5 text-xs", className)}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={locale === option.value}
          onClick={() => {
            if (locale !== option.value) void setLocale(option.value);
          }}
          className={cn(
            "rounded-full px-2.5 py-1 tracking-wide transition-colors",
            locale === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
