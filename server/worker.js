import dotenv from "dotenv";

dotenv.config();

import { Worker } from "bullmq";
import { env } from "./config/env.js";
import { processPdf } from "./service/pdf.service.js";

new Worker(
  "file-upload-queue",
  async (job) => {
    await processPdf(job.data);
  },
  {
    connection: {
      host: env.redisHost,
      port: env.redisPort,
    },
  },
);

console.log("Ingestion worker started");
