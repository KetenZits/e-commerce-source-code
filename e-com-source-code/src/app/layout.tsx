import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});

const ibmPlex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} ${ibmPlex.variable} dark h-full`}
    >
      <body className="flex min-h-full flex-col bg-void">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
