import { addMinutes } from "date-fns";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type NotificationPayload = {
  event: string;
  subject: string;
  text: string;
  data?: Record<string, unknown>;
};

interface NotificationAdapter {
  channel: string;
  send(payload: NotificationPayload): Promise<void>;
}

class DiscordAdapter implements NotificationAdapter {
  channel = "discord";
  async send(payload: NotificationPayload) {
    if (!env.DISCORD_WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL is not set");
    const res = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `**${payload.subject}**\n${payload.text}` }),
    });
    if (!res.ok) throw new Error(`Discord webhook ${res.status}`);
  }
}

class TelegramAdapter implements NotificationAdapter {
  channel = "telegram";
  async send(payload: NotificationPayload) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      throw new Error("Telegram is not configured");
    }
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: `${payload.subject}\n${payload.text}`,
      }),
    });
    if (!res.ok) throw new Error(`Telegram ${res.status}`);
  }
}

class EmailAdapter implements NotificationAdapter {
  channel = "email";
  async send(payload: NotificationPayload) {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
    const resend = new Resend(env.RESEND_API_KEY);
    const to = typeof payload.data?.email === "string" ? payload.data.email : undefined;
    if (!to) throw new Error("No email recipient");
    const result = await resend.emails.send({
      from: env.RESEND_FROM,
      to,
      subject: payload.subject,
      text: payload.text,
    });
    if (result.error) throw new Error(result.error.message);
  }
}

const adapters: NotificationAdapter[] = [new DiscordAdapter(), new TelegramAdapter(), new EmailAdapter()];

function adapterFor(channel: string) {
  return adapters.find((adapter) => adapter.channel === channel);
}

export async function notify(payload: NotificationPayload) {
  for (const adapter of adapters) {
    const log = await db.notificationLog.create({
      data: {
        channel: adapter.channel,
        event: payload.event,
        payload: payload as unknown as object,
        status: "QUEUED",
        attemptCount: 1,
      },
    });
    try {
      await adapter.send(payload);
      await db.notificationLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error) {
      logger.warn("Notification failed", { channel: adapter.channel, error: String(error) });
      await db.notificationLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
          nextAttemptAt: addMinutes(new Date(), 5),
        },
      });
    }
  }
}

export async function retryFailedNotifications(limit = 20) {
  const due = await db.notificationLog.findMany({
    where: {
      status: "FAILED",
      nextAttemptAt: { lte: new Date() },
      attemptCount: { lt: 5 },
    },
    take: limit,
    orderBy: { nextAttemptAt: "asc" },
  });
  let retried = 0;
  for (const log of due) {
    const adapter = adapterFor(log.channel);
    if (!adapter) continue;
    const payload = log.payload as unknown as NotificationPayload;
    try {
      await adapter.send(payload);
      await db.notificationLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date(), error: null, nextAttemptAt: null },
      });
    } catch (error) {
      await db.notificationLog.update({
        where: { id: log.id },
        data: {
          attemptCount: { increment: 1 },
          error: error instanceof Error ? error.message : "Unknown error",
          nextAttemptAt: addMinutes(new Date(), 5 * (log.attemptCount + 1)),
        },
      });
    }
    retried += 1;
  }
  return retried;
}
