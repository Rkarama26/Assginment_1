import { pool } from "../config/db.js";

export async function createConversation(workspaceId, title = "New chat") {
  const { rows } = await pool.query(
    `INSERT INTO conversations (workspace_id, title)
     VALUES ($1, $2)
     RETURNING id, workspace_id, title, created_at, updated_at`,
    [workspaceId, title],
  );
  return rows[0];
}

export async function getConversation(conversationId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, title, created_at, updated_at
     FROM conversations
     WHERE id = $1 AND workspace_id = $2`,
    [conversationId, workspaceId],
  );
  return rows[0] ?? null;
}

export async function listConversations(workspaceId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.workspace_id, c.title, c.created_at, c.updated_at,
            (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM conversations c
     WHERE c.workspace_id = $1
     ORDER BY c.updated_at DESC`,
    [workspaceId],
  );
  return rows;
}

export async function touchConversation(conversationId) {
  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId],
  );
}

export async function updateConversationTitle(conversationId, title) {
  await pool.query(
    `UPDATE conversations SET title = $2, updated_at = NOW() WHERE id = $1`,
    [conversationId, title],
  );
}

export async function createMessage({
  conversationId,
  role,
  content,
  citations = [],
}) {
  const { rows } = await pool.query(
    `INSERT INTO messages (conversation_id, role, content, citations)
     VALUES ($1, $2, $3, $4)
     RETURNING id, conversation_id, role, content, citations, created_at`,
    [conversationId, role, content, JSON.stringify(citations)],
  );
  return rows[0];
}

export async function listMessages(conversationId) {
  const { rows } = await pool.query(
    `SELECT id, conversation_id, role, content, citations, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId],
  );
  return rows;
}

export async function getRecentMessages(conversationId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT role, content FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, limit],
  );
  return rows.reverse();
}
