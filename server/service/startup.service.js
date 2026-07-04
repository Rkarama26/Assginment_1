import { env } from "../config/env.js";
import { checkRedisConnection } from "../config/redis.js";
import { geminiEmbeddings } from "../ai/embedding.js";
import { ensureCollection } from "./qdrant.service.js";

const RETRY_MS = 5000;

async function waitFor(label, check, maxAttempts = 12) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (await check()) {
        console.log(`[startup] ${label} is ready`);
        return true;
      }
    } catch {
      // retry
    }
    console.warn(
      `[startup] ${label} not ready (attempt ${attempt}/${maxAttempts}) — retrying in ${RETRY_MS / 1000}s…`,
    );
    await new Promise((r) => setTimeout(r, RETRY_MS));
  }
  return false;
}

export async function checkQdrantConnection() {
  await ensureCollection(env.embeddingDimensions);
  return true;
}

export async function initializeOptionalServices() {
  const redisOk = await waitFor("Redis/Valkey", checkRedisConnection, 3);
  if (!redisOk) {
    console.warn(
      "[startup] Redis unavailable — uploads will fail until Valkey is running.\n" +
        "  Start it with: docker compose up -d valkey\n" +
        "  (Docker Desktop must be running on Windows)",
    );
  }

  const qdrantOk = await waitFor("Qdrant", checkQdrantConnection, 3);
  if (!qdrantOk) {
    console.warn(
      "[startup] Vector store unavailable — ingestion/search will fail until Qdrant is ready.",
    );
    return { redis: redisOk, qdrant: false };
  }

  try {
    const probe = await geminiEmbeddings.embedQuery("init");
    await ensureCollection(probe.length);
    console.log(`[startup] Qdrant collection "${env.qdrantCollection}" ready`);
  } catch (error) {
    console.warn(
      "[startup] Embedding/vector-store init failed:",
      error.message,
    );
    return { redis: redisOk, qdrant: false };
  }

  return { redis: redisOk, qdrant: true };
}

export async function getServiceHealth() {
  const [redis, qdrant] = await Promise.all([
    checkRedisConnection().catch(() => false),
    checkQdrantConnection().catch(() => false),
  ]);
  return { redis, qdrant };
}
