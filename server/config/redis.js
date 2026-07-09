import { env } from "./env.js";
import Redis from "ioredis";

/** BullMQ requires maxRetriesPerRequest: null for Workers */

export function getRedisConnection() {
  return {
    url: env.redisUrl,
    maxRetriesPerRequest: null,
  };
}

export async function checkRedisConnection() {
  console.log(env.redisUrl.replace(/:(.*?)@/, ":****@"));
  const client = new Redis(env.redisUrl);
  try {
    await client.ping();
    return true;
  } catch (err) {
    console.error("Redis connection failed:", err);
    return false;
  } finally {
    client.disconnect();
  }
}
