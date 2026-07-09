import { checkRedisConnection } from "../config/redis.js";

const RETRY_MS = 5000;

async function waitFor(label, check, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (await check()) {
        console.log(`[startup] ${label} is ready`);
        return true;
      }
    } catch {
      console.error(`[startup] ${label} check failed (attempt ${attempt}/${maxAttempts})`);
    }

    console.warn(
      `[startup] ${label} not ready (attempt ${attempt}/${maxAttempts}) — retrying in ${RETRY_MS / 1000}s...`,
    );

    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }

  return false;
}

export async function initializeOptionalServices() {
  const redisOk = await waitFor("Upstash Redis", checkRedisConnection);

  if (!redisOk) {
    console.warn(
      "[startup] Upstash Redis unavailable. Queue processing will not work until Redis is reachable.",
    );
  }

  return {
    redis: redisOk,
  };
}

export async function getServiceHealth() {
  const redis = await checkRedisConnection().catch(() => false);

  return {
    redis,
  };
}