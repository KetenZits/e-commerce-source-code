import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type PaymentConfig = {
  promptpayId: string;
  accountName: string;
  paymentMode: "demo" | "live";
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const rows = await db.storeSetting.findMany({
    where: { key: { in: ["promptpayId", "accountName", "paymentMode"] } },
  });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    promptpayId: map.promptpayId?.trim() || env.PROMPTPAY_ID,
    accountName: map.accountName?.trim() || "Atelier",
    paymentMode:
      map.paymentMode === "live" ? "live" : map.paymentMode === "demo" ? "demo" : env.PAYMENT_MODE === "live" ? "live" : "demo",
  };
}

export async function savePaymentConfig(input: PaymentConfig) {
  const entries: [string, string][] = [
    ["promptpayId", input.promptpayId.trim()],
    ["accountName", input.accountName.trim()],
    ["paymentMode", input.paymentMode],
  ];
  for (const [key, value] of entries) {
    await db.storeSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  return input;
}
