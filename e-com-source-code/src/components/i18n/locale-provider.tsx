"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/dictionaries/en";
import { createT, type MessageKey } from "@/lib/i18n/t";

type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: TFn;
  setLocale: (locale: Locale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(locale);
  const [currentMessages, setCurrentMessages] = useState(messages);

  useEffect(() => {
    setCurrent(locale);
    setCurrentMessages(messages);
  }, [locale, messages]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: current,
      messages: currentMessages,
      t: createT(currentMessages),
      setLocale: async (next) => {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        setCurrent(next);
        router.refresh();
      },
    }),
    [current, currentMessages, router],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return context;
}
