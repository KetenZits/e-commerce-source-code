import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { env, hasRedis } from "@/lib/env";
import { cancelPendingOrder, expirePendingOrders, fulfillPaidOrder } from "@/server/services/fulfillment";
import { verifySlip } from "@/server/services/payment";
import { retryFailedNotifications } from "@/server/services/notifications";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { indexProduct, removeProduct } from "@/server/services/search";
import { slipFingerprint } from "@/server/services/audit";

export type JobName =
  | "verify-payment"
  | "index-product"
  | "remove-product"
  | "expire-orders"
  | "retry-notifications";

type JobData = {
  "verify-payment": { orderId: string };
  "index-product": { productId: string };
  "remove-product": { productId: string };
  "expire-orders": Record<string, never>;
  "retry-notifications": Record<string, never>;
};

let connection: IORedis | null = null;
let queue: Queue | null = null;

function redis() {
  if (!hasRedis()) return null;
  connection ??= new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

function jobs() {
  const conn = redis();
  if (!conn) return null;
  queue ??= new Queue("atelier", { connection: conn });
  return queue;
}

async function handle(name: JobName, data: JobData[JobName]) {
  if (name === "expire-orders") {
    const count = await expirePendingOrders();
    logger.info("Expired pending orders", { count });
    return;
  }
  if (name === "retry-notifications") {
    const count = await retryFailedNotifications();
    logger.info("Retried notifications", { count });
    return;
  }
  if (name === "verify-payment") {
    const { orderId } = data as JobData["verify-payment"];
    const claimed = await db.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { slipUncertain: true },
    });
    if (claimed.count !== 1) return;
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING") return;
    const result = await verifySlip({
      slipImageUrl: order.slipImageUrl,
      expectedAmountCents: order.totalCents,
    });
    if (result.ok) {
      if (order.slipImageUrl) {
        const fingerprint = slipFingerprint(order.slipImageUrl);
        const duplicate = await db.paymentTransaction.findFirst({
          where: { slipFingerprint: fingerprint, orderId: { not: order.id } },
        });
        if (duplicate) {
          await cancelPendingOrder(order.id, "Duplicate payment slip rejected.");
          return;
        }
        await db.paymentTransaction.updateMany({
          where: { orderId: order.id, status: "PENDING" },
          data: {
            slipFingerprint: fingerprint,
            externalRef: result.externalRef ?? undefined,
            raw: (result.raw ?? undefined) as object | undefined,
          },
        });
      }
      await fulfillPaidOrder(order.id);
      return;
    }
    if (!result.uncertain) {
      await cancelPendingOrder(order.id, "Slip verification failed.");
      return;
    }
    await db.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { slipUncertain: true },
    });
  }
  if (name === "index-product") {
    const product = await db.product.findUnique({
      where: { id: (data as JobData["index-product"]).productId },
      include: { category: true, variants: true },
    });
    if (product) await indexProduct(product);
    return;
  }
  if (name === "remove-product") {
    await removeProduct((data as JobData["remove-product"]).productId);
  }
}

export async function enqueue<K extends JobName>(name: K, data: JobData[K]) {
  const q = jobs();
  if (q) {
    await q.add(name, data, {
      jobId: name === "verify-payment" ? `verify-${(data as JobData["verify-payment"]).orderId}` : undefined,
      removeOnComplete: 100,
    });
    return;
  }
  await handle(name, data);
}

export function startWorker() {
  const conn = redis();
  if (!conn) {
    logger.info("Redis is not configured — jobs run inline.");
    return null;
  }
  return new Worker(
    "atelier",
    async (job: Job) => {
      await handle(job.name as JobName, job.data);
    },
    { connection: conn }
  );
}
