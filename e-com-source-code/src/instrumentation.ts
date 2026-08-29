export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { validateRuntimeEnv } = await import("@/lib/env");
  const { logger } = await import("@/lib/logger");
  const result = validateRuntimeEnv();
  if (!result.ok && process.env.NODE_ENV === "production") {
    throw new Error(`Missing production secrets: ${result.missing.join(", ")}`);
  }
  if (!result.ok) {
    logger.warn("Development env is using local fallbacks", { missing: result.missing });
  } else {
    logger.info("Runtime environment validated");
  }
}
