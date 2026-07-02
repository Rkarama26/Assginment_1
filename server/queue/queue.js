import { Queue } from "bullmq";
import { env } from "../config/env.js";

export const fileQueue = new Queue("file-upload-queue", {
  connection: {
    host: env.redisHost,
    port: env.redisPort,
  },
});
