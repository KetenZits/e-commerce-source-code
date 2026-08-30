import { cookies } from "next/headers";
import { getStorefrontConfig } from "@/lib/storefront-config";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries } from "./dictionaries";
import { createT } from "./t";

export async function getLocale(fallback?: Locale): Promise<Locale> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  if (fallback && isLocale(fallback)) return fallback;
  const storefront = await getStorefrontConfig();
  return isLocale(storefront.business.documentLanguage)
    ? storefront.business.documentLanguage
    : DEFAULT_LOCALE;
}

export async function getI18n(fallback?: Locale) {
  const locale = await getLocale(fallback);
  const messages = dictionaries[locale];
  return { locale, messages, t: createT(messages) };
}
