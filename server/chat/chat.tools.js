import { executeToolCall } from "../service/tools.service.js";
import { createToolCallLog } from "../repositories/tool-call.repository.js";
import { logger } from "../utils/logger.js";
import { withTimeout, safeStringifyArgs } from "./chat.helpers.js";
import {
  TOOL_CALL_TIMEOUT_MS,
  MAX_TOOL_CALLS_PER_TURN,
} from "./chat.constants.js";

async function safeCreateToolCallLog(payload, requestId) {
  try {
    return await createToolCallLog(payload);
  } catch (logError) {
    logger.error({
      msg: "Failed to persist tool call log",
      requestId,
      workspaceId: payload.workspaceId,
      toolName: payload.toolName,
      error: logError.message,
      stack: logError.stack,
    });
    return { ...payload, persisted: false };
  }
}

async function runSingleTool(workspaceId, name, args, requestId) {
  try {
    const result = await withTimeout(
      () => executeToolCall(workspaceId, name, args),
      TOOL_CALL_TIMEOUT_MS,
      `Tool "${name}" timed out`,
    );
    return { success: true, result };
  } catch (error) {
    logger.warn({
      msg: "Tool execution failed",
      requestId,
      workspaceId,
      toolName: name,
      args: safeStringifyArgs(args),
      error: error.message,
    });
    return { success: false, error };
  }
}

export async function executeFunctionCalls({
  functionCalls,
  workspaceId,
  assistantMessageId,
  requestId,
}) {
  const functionResponseParts = [];
  const logEntries = [];

  const callsToRun = functionCalls.slice(0, MAX_TOOL_CALLS_PER_TURN);
  if (functionCalls.length > MAX_TOOL_CALLS_PER_TURN) {
    logger.warn({
      msg: "Function call count exceeded per-turn limit, truncating",
      requestId,
      requested: functionCalls.length,
      allowed: MAX_TOOL_CALLS_PER_TURN,
    });
  }

  for (const part of callsToRun) {
    const { name, args } = part.functionCall ?? {};
    const outcome = await runSingleTool(
      workspaceId,
      name,
      args ?? {},
      requestId,
    );

    const logEntry = await safeCreateToolCallLog(
      {
        workspaceId,
        messageId: assistantMessageId,
        toolName: name ?? "unknown",
        arguments: args ?? {},
        result: outcome.success ? outcome.result : null,
        status: outcome.success ? "success" : "error",
        errorMessage: outcome.success
          ? undefined
          : (outcome.error?.message ?? "Unknown tool error"),
      },
      requestId,
    );

    logEntries.push(logEntry);
    functionResponseParts.push({
      functionResponse: {
        name: name ?? "unknown",
        response: outcome.success
          ? { result: outcome.result }
          : { error: outcome.error?.message ?? "Unknown tool error" },
      },
    });
  }

  return { functionResponseParts, logEntries };
}
