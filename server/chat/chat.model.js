import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { TOOL_DECLARATIONS } from "../utils/promts.js";
import { withTimeout, sleep } from "./chat.helpers.js";
import { ModelError, TimeoutError } from "./chat.errors.js";
import {
  MODEL_CALL_TIMEOUT_MS,
  MODEL_RETRY_ATTEMPTS,
  MODEL_RETRY_BASE_DELAY_MS,
} from "./chat.constants.js";

const ai = new GoogleGenAI({ apiKey: env.googleApiKey });
const MODEL = "gemini-3.5-flash";

export function isRateLimitError(error) {
  return (
    error?.status === 429 ||
    error?.code === 429 ||
    /RESOURCE_EXHAUSTED/i.test(error?.message ?? "")
  );
}

function isRetryableError(error) {
  if (isRateLimitError(error)) return true;
  const status = error?.status ?? error?.code;
  return typeof status === "number" && status >= 500;
}

export async function callModelWithRetry({
  contents,
  systemInstruction,
  requestId,
}) {
  let lastError;

  for (let attempt = 0; attempt <= MODEL_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await withTimeout(
        () =>
          ai.models.generateContent({
            model: MODEL,
            contents,
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            },
          }),
        MODEL_CALL_TIMEOUT_MS,
        "Model call timed out",
      );
    } catch (error) {
      lastError = error;
      const retryable =
        isRetryableError(error) && attempt < MODEL_RETRY_ATTEMPTS;

      logger.warn({
        msg: "generateContent call failed",
        requestId,
        attempt: attempt + 1,
        willRetry: retryable,
        errorCode: error?.status ?? error?.code,
        error: error.message,
      });

      if (!retryable) break;
      await sleep(MODEL_RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  if (lastError instanceof TimeoutError) {
    throw new ModelError("Model call timed out", {
      code: "MODEL_TIMEOUT",
      cause: lastError,
    });
  }
  if (isRateLimitError(lastError)) {
    throw new ModelError("Model is rate-limited", {
      code: "RATE_LIMIT",
      cause: lastError,
    });
  }
  throw new ModelError("Model call failed", {
    code: "MODEL_CALL_FAILED",
    cause: lastError,
  });
}
