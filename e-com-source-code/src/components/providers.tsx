"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { useState } from "react";
import { Toaster } from "sonner";
import { createQueryClient, createTrpcClient, trpc } from "@/trpc/client";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import { CookieConsent } from "@/components/legal/cookie-consent";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/dictionaries/en";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
}) {
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(createTrpcClient);

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <LocaleProvider locale={locale} messages={messages}>
          <MotionConfig reducedMotion="user">
            <WishlistProvider>{children}</WishlistProvider>
          </MotionConfig>
          <CookieConsent />
          <AnalyticsScripts />
          <Toaster
            theme="light"
            position="bottom-right"
            toastOptions={{
              className: "font-sans border border-border bg-card text-foreground shadow-none",
            }}
          />
          </LocaleProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
