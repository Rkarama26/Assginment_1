import { z } from "zod";
import { pool } from "../config/db.js";

const saveTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
});

const TOOL_SCHEMAS = {
  save_task: saveTaskSchema,
};

async function saveTask(workspaceId, args) {
  const parsed = saveTaskSchema.parse(args);
  const { rows } = await pool.query(
    `INSERT INTO tasks (workspace_id, title, description)
     VALUES ($1, $2, $3)
     RETURNING id, title, description, created_at`,
    [workspaceId, parsed.title, parsed.description ?? null],
  );
  return {
    task: rows[0],
    message: `Task "${parsed.title}" saved to workspace.`,
  };
}

const TOOL_HANDLERS = {
  save_task: saveTask,
};

/**
 * @param {string} workspaceId
 * @param {string} toolName
 * @param {object} args
 */
export async function executeToolCall(workspaceId, toolName, args) {
  if (!TOOL_HANDLERS[toolName]) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const schema = TOOL_SCHEMAS[toolName];
  if (schema) {
    schema.parse(args);
  }

  return TOOL_HANDLERS[toolName](workspaceId, args);
}

export { TOOL_SCHEMAS };
