import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";
const optional = z.string().optional().default("");

function requiredInProd(value: string | undefined, fallback = "") {
  if (value) return value;
  if (isProd) return "";
  return fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NEXTAUTH_SECRET: requiredInProd(
    process.env.NEXTAUTH_SECRET,
    "dev-secret-change-me-in-production",
  ),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  DIGITAL_SECRETS_KEY: requiredInProd(
    process.env.DIGITAL_SECRETS_KEY,
    process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  ),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  PROMPTPAY_ID: process.env.PROMPTPAY_ID ?? "0812345678",
  PAYMENT_MODE: process.env.PAYMENT_MODE === "live" ? "live" : "demo",
  PAYMENT_TTL_MINUTES: Number(process.env.PAYMENT_TTL_MINUTES ?? 15),
  SLIPOK_API_KEY: process.env.SLIPOK_API_KEY ?? "",
  EASYSLIP_API_KEY: process.env.EASYSLIP_API_KEY ?? "",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? "",
  R2_BUCKET: process.env.R2_BUCKET ?? "",
  R2_ENDPOINT: process.env.R2_ENDPOINT ?? "",
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL ?? "",
  LOW_STOCK_THRESHOLD: Number(process.env.LOW_STOCK_THRESHOLD ?? 5),
  REDIS_URL: process.env.REDIS_URL ?? "",
  MEILI_HOST: process.env.MEILI_HOST ?? "",
  MEILI_API_KEY: process.env.MEILI_API_KEY ?? "",
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ?? "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM: process.env.RESEND_FROM ?? "Atelier <noreply@localhost>",
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
};

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(16),
  DIGITAL_SECRETS_KEY: z.string().min(16),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
});

export function isProduction() {
  return isProd;
}

export function validateRuntimeEnv() {
  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET === "dev-secret-change-me-in-production") {
    missing.push("NEXTAUTH_SECRET");
  }
  if (!env.DIGITAL_SECRETS_KEY || env.DIGITAL_SECRETS_KEY === "dev-secret-change-me-in-production") {
    missing.push("DIGITAL_SECRETS_KEY");
  }
  if (missing.length && isProd) {
    throw new Error(
      `Production is fail-closed. Set ${missing.join(", ")} before starting the server.`,
    );
  }
  return { ok: missing.length === 0, missing };
}

export function hasGoogleOAuth() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function hasR2() {
  return Boolean(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_ENDPOINT);
}

export function hasRedis() {
  return Boolean(env.REDIS_URL);
}

export function hasMeili() {
  return Boolean(env.MEILI_HOST);
}
