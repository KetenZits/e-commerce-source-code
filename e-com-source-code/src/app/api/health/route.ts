import { db } from "@/lib/db";
import { env, hasRedis, validateRuntimeEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const envCheck = validateRuntimeEnv();
  let database = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const status = database === "ok" ? 200 : 503;
  return Response.json(
    {
      ok: status === 200,
      service: "atelier",
      time: new Date().toISOString(),
      checks: {
        database,
        redis: hasRedis() ? "configured" : "inline",
        env: envCheck.ok ? "ok" : env.NODE_ENV === "production" ? "fail" : "dev-fallback",
      },
    },
    { status },
  );
}
