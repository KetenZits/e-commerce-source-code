import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { getI18n } from "@/lib/i18n/get-locale";
import { getStorefrontConfig } from "@/lib/storefront-config";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

const displayThai = Noto_Serif_Thai({
  subsets: ["thai"],
  weight: ["500", "600"],
  variable: "--font-display-thai",
});

const body = IBM_Plex_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-load",
});

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await getStorefrontConfig();
  return {
    title: {
      default: `${storefront.siteName} — ${storefront.siteTagline}`,
      template: `%s · ${storefront.siteName}`,
    },
    description: storefront.siteTagline,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [storefront, i18n] = await Promise.all([getStorefrontConfig(), getI18n()]);
  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return (
    <html
      lang={i18n.locale}
      className={`${display.variable} ${displayThai.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <Providers locale={i18n.locale} messages={i18n.messages}>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: storefront.business.legalName || storefront.siteName,
              url: origin,
              email: storefront.business.contactEmail,
              address: {
                "@type": "PostalAddress",
                streetAddress: storefront.business.address,
                addressLocality: storefront.business.city,
                addressCountry: storefront.business.country,
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
