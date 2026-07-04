import { pool } from "../config/db.js";

export async function createToolCallLog({
  workspaceId,
  messageId,
  toolName,
  arguments: args,
  result,
  status,
  errorMessage,
}) {
  const { rows } = await pool.query(
    `INSERT INTO tool_calls (workspace_id, message_id, tool_name, arguments, result, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, workspace_id, message_id, tool_name, arguments, result, status, error_message, created_at`,
    [
      workspaceId,
      messageId,
      toolName,
      JSON.stringify(args),
      result ? JSON.stringify(result) : null,
      status,
      errorMessage ?? null,
    ],
  );
  return rows[0];
}

export async function listToolCallsByWorkspace(workspaceId, limit = 50) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, message_id, tool_name, arguments, result, status, error_message, created_at
     FROM tool_calls
     WHERE workspace_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [workspaceId, limit],
  );
  return rows;
}

export async function listTasksByWorkspace(workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, title, description, created_at
     FROM tasks
     WHERE workspace_id = $1
     ORDER BY created_at DESC`,
    [workspaceId],
  );
  return rows;
}
