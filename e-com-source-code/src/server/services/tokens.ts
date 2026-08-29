import { addHours, addMinutes } from "date-fns";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashToken, newToken } from "@/server/services/audit";

type TokenClient = Pick<Prisma.TransactionClient, "authToken">;

export async function issueAuthToken(
  userId: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET" | "ACCOUNT_LOCK",
  ttlMinutes: number,
  client: TokenClient = db,
) {
  const token = newToken();
  await client.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(token),
      expiresAt: addMinutes(new Date(), ttlMinutes),
    },
  });
  return token;
}

export async function consumeAuthToken(
  token: string,
  type: "EMAIL_VERIFY" | "PASSWORD_RESET",
  client: TokenClient = db,
) {
  const record = await client.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!record || record.type !== type || record.consumedAt || record.expiresAt < new Date()) {
    return null;
  }
  await client.authToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return record;
}

export async function lockAccount(userId: string, minutes = 15) {
  await db.authToken.create({
    data: {
      userId,
      type: "ACCOUNT_LOCK",
      tokenHash: hashToken(`lock:${userId}:${newToken(8)}`),
      expiresAt: addMinutes(new Date(), minutes),
    },
  });
}

export async function isAccountLocked(userId: string) {
  const lock = await db.authToken.findFirst({
    where: {
      userId,
      type: "ACCOUNT_LOCK",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return Boolean(lock);
}

export async function countRecentFailures(userId: string, windowMinutes = 15) {
  return db.authToken.count({
    where: {
      userId,
      type: "LOGIN_FAIL",
      createdAt: { gte: addMinutes(new Date(), -windowMinutes) },
    },
  });
}

export async function recordLoginFailure(userId: string) {
  await db.authToken.create({
    data: {
      userId,
      type: "LOGIN_FAIL",
      tokenHash: hashToken(`fail:${userId}:${newToken(8)}`),
      expiresAt: addHours(new Date(), 1),
    },
  });
  const failures = await countRecentFailures(userId);
  if (failures >= 5) await lockAccount(userId);
  return failures;
}

export async function clearLoginFailures(userId: string) {
  await db.authToken.updateMany({
    where: { userId, type: { in: ["LOGIN_FAIL", "ACCOUNT_LOCK"] }, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}
