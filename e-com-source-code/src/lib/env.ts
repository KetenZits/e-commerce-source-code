import { z } from "zod";

const optional = z.string().optional().default("");

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-production",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
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
  DOWNLOAD_URL_TTL_MINUTES: Number(process.env.DOWNLOAD_URL_TTL_MINUTES ?? 15),
  MAX_DOWNLOADS: Number(process.env.MAX_DOWNLOADS ?? 5),
  REDIS_URL: process.env.REDIS_URL ?? "",
  MEILI_HOST: process.env.MEILI_HOST ?? "",
  MEILI_API_KEY: process.env.MEILI_API_KEY ?? "",
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL ?? "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? "",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM: process.env.RESEND_FROM ?? "Sourcecode <noreply@localhost>",
};

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
});

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
