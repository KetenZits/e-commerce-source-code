"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/consent";
import { useI18n } from "@/components/i18n/locale-provider";

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() == null);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          {t("cookie.body")}{" "}
          <Link href="/legal/privacy" className="text-foreground underline">
            {t("cookie.privacy")}
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm"
            onClick={() => {
              writeConsent(false);
              setVisible(false);
            }}
          >
            {t("cookie.essential")}
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={() => {
              writeConsent(true);
              setVisible(false);
            }}
          >
            {t("cookie.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
