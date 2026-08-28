import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${displayThai.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
