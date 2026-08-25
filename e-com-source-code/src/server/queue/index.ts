import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { env, hasRedis } from "@/lib/env";
import { fulfillPaidOrder } from "@/server/services/license";
import { verifySlip } from "@/server/services/payment";
import { db } from "@/lib/db";
import { indexProduct, removeProduct } from "@/server/services/search";

export type JobName = "verify-payment" | "index-product" | "remove-product";

type JobData = {
  "verify-payment": { orderId: string };
  "index-product": { productId: string };
  "remove-product": { productId: string };
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
  queue ??= new Queue("sourcecode", { connection: conn });
  return queue;
}

async function handle(name: JobName, data: JobData[JobName]) {
  if (name === "verify-payment") {
    const { orderId } = data as JobData["verify-payment"];
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING") return;
    const result = await verifySlip({
      slipImageUrl: order.slipImageUrl,
      expectedAmountCents: order.priceCents,
    });
    if (result.ok) {
      await fulfillPaidOrder(order.id);
      return;
    }
    await db.order.update({
      where: { id: order.id },
      data: { slipUncertain: result.uncertain, status: result.uncertain ? "PENDING" : "FAILED" },
    });
    return;
  }
  if (name === "index-product") {
    const product = await db.product.findUnique({ where: { id: (data as JobData["index-product"]).productId } });
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
    await q.add(name, data);
    return;
  }
  await handle(name, data);
}

export function startWorker() {
  const conn = redis();
  if (!conn) {
    console.log("Redis is not configured — jobs run inline.");
    return null;
  }
  return new Worker(
    "sourcecode",
    async (job: Job) => {
      await handle(job.name as JobName, job.data);
    },
    { connection: conn }
  );
}
