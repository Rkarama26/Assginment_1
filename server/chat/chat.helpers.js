import { TimeoutError } from "./chat.errors.js";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTimeout(promiseFactory, ms, timeoutMessage) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(timeoutMessage)), ms);
  });
  try {
    return await Promise.race([promiseFactory(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export function safeStringifyArgs(args) {
  try {
    return JSON.stringify(args);
  } catch {
    return "<unserializable args>";
  }
}