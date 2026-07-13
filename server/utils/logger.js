import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.logLevel ?? "info",
  base: {
    service: "chat-service",
    env: env.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Pretty-print in local dev, raw JSON in production
  transport:
    env.nodeEnv !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});