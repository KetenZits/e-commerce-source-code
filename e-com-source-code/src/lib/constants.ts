export const SITE_NAME = "Atelier";
export const SITE_TAGLINE = "Considered goods for daily use.";

export const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);

export const THAI_PROVINCES = [
  "Bangkok",
  "Nonthaburi",
  "Pathum Thani",
  "Samut Prakan",
  "Samut Sakhon",
  "Nakhon Pathom",
  "Chiang Mai",
  "Chiang Rai",
  "Phuket",
  "Khon Kaen",
  "Nakhon Ratchasima",
  "Chonburi",
  "Songkhla",
  "Ayutthaya",
  "Other",
] as const;

export const BANGKOK_METRO = [
  "Bangkok",
  "Nonthaburi",
  "Pathum Thani",
  "Samut Prakan",
  "Samut Sakhon",
  "Nakhon Pathom",
] as const;
