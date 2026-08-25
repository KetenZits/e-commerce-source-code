const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function formatMoney(cents: number, currency = "THB") {
  if (currency === "THB") return THB.format(cents / 100);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function satangToBaht(cents: number) {
  return cents / 100;
}
