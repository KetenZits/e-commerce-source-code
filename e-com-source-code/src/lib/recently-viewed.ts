const KEY = "store-recently-viewed";
const LIMIT = 8;

export type RecentProduct = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  images: string[];
  minPriceCents: number;
  currency: string;
  inStock: boolean;
};

export function readRecentlyViewed(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as RecentProduct[];
    return Array.isArray(parsed) ? parsed.slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

export function rememberProduct(product: RecentProduct) {
  if (typeof window === "undefined") return;
  const next = [product, ...readRecentlyViewed().filter((item) => item.id !== product.id)].slice(
    0,
    LIMIT,
  );
  window.localStorage.setItem(KEY, JSON.stringify(next));
}
