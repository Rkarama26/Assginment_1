import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis.js";

/** @type {Queue | null} */
let fileQueue = null;

export function getFileQueue() {
  if (!fileQueue) {
    fileQueue = new Queue("file-upload-queue", {
      connection: getRedisConnection(),
    });
  }
  return fileQueue;
}
 