export type CookieConsent = {
  necessary: true;
  analytics: boolean;
};

const KEY = "store-cookie-consent";

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { analytics?: boolean };
    return { necessary: true, analytics: Boolean(parsed.analytics) };
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean): CookieConsent {
  const value: CookieConsent = { necessary: true, analytics };
  window.localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event("store-cookie-consent"));
  return value;
}
