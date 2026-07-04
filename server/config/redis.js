import { env } from "./env.js";

/** BullMQ requires maxRetriesPerRequest: null for Workers */
export function getRedisConnection() {
  return {
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: null,
  };
}

export async function checkRedisConnection() {
  const { default: Redis } = await import("ioredis");
  const client = new Redis({
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  try {
    await client.connect();
    await client.ping();
    return true;
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}
