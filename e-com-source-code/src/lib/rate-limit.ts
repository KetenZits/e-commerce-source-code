import { env, hasRedis } from "@/lib/env";

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();
let redis: import("ioredis").default | null = null;

async function redisClient() {
  if (!hasRedis()) return null;
  if (redis) return redis;
  const IORedis = (await import("ioredis")).default;
  redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await redis.connect();
  } catch {
    redis = null;
    return null;
  }
  return redis;
}

export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const client = await redisClient();
  if (client) {
    const redisKey = `rl:${opts.key}`;
    const count = await client.incr(redisKey);
    if (count === 1) await client.pexpire(redisKey, opts.windowMs);
    const ttl = await client.pttl(redisKey);
    return {
      ok: count <= opts.limit,
      remaining: Math.max(0, opts.limit - count),
      resetAt: now + Math.max(ttl, 0),
    };
  }

  const current = memory.get(opts.key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + opts.windowMs };
    memory.set(opts.key, next);
    return { ok: true, remaining: opts.limit - 1, resetAt: next.resetAt };
  }
  current.count += 1;
  return {
    ok: current.count <= opts.limit,
    remaining: Math.max(0, opts.limit - current.count),
    resetAt: current.resetAt,
  };
}
