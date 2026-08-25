import { asStringArray } from "@/lib/product";

export type ShippingZoneInput = {
  id: string;
  name: string;
  provinces: unknown;
  minWeightGrams: number;
  maxWeightGrams: number | null;
  feeCents: number;
  sortOrder: number;
};

export function matchShippingZone(zones: ShippingZoneInput[], province: string, weightGrams: number) {
  const sorted = [...zones].sort((a, b) => a.sortOrder - b.sortOrder);
  const matches = sorted.filter((zone) => {
    const provinces = asStringArray(zone.provinces);
    const provinceOk = provinces.includes("*") || provinces.includes(province);
    const weightOk =
      weightGrams >= zone.minWeightGrams &&
      (zone.maxWeightGrams == null || weightGrams <= zone.maxWeightGrams);
    return provinceOk && weightOk;
  });
  return matches[0] ?? null;
}

export function estimatedDeliveryLabel(province: string) {
  const metro = ["Bangkok", "Nonthaburi", "Pathum Thani", "Samut Prakan", "Samut Sakhon", "Nakhon Pathom"];
  return metro.includes(province) ? "2–4 days" : "4–7 days";
}
