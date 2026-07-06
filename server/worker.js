import dotenv from "dotenv";
import { Worker } from "bullmq";
import { env } from "./config/env.js";
import { getRedisConnection } from "./config/redis.js";
import { checkRedisConnection } from "./config/redis.js";
import { processPdf } from "./service/pdf.service.js";

dotenv.config();

export async function startWorker() { 
  const redisOk = await checkRedisConnection();
  if (!redisOk) {
    console.error( 
      "[worker] Cannot connect to Redis/Valkey at",
      `${env.redisHost}:${env.redisPort}`,
    );
    console.error(
      "[worker] Start Docker Desktop, then run: docker compose up -d valkey qdrant",
    );  
    process.exit(1);
  }

  const worker = new Worker(
    "file-upload-queue",
    async (job) => {
      console.log(`[worker] Processing document ${job.data.documentId}`);
      await processPdf(job.data);
      console.log(`[worker] Finished document ${job.data.documentId}`);
    },
    {
      connection: getRedisConnection(),
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[worker] Redis connection error:", err.message);
  });

  console.log("[worker] Ingestion worker started — waiting for upload jobs");
}
