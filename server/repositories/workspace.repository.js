import { pool } from "../config/db.js";

export async function listWorkspacesByUser(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, name, created_at, updated_at
     FROM workspaces
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
  );
  return rows;
}

export async function getWorkspaceById(id, userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, name, created_at, updated_at
     FROM workspaces
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function createWorkspace(userId, name) {
  const { rows } = await pool.query(
    `INSERT INTO workspaces (user_id, name)
     VALUES ($1, $2)
     RETURNING id, user_id, name, created_at, updated_at`,
    [userId, name],
  );
  return rows[0];
}

export async function updateWorkspace(id, userId, name) {
  const { rows } = await pool.query(
    `UPDATE workspaces
     SET name = $3, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, name, created_at, updated_at`,
    [id, userId, name],
  );
  return rows[0] ?? null;
}

export async function ensureDefaultWorkspace(userId) {
  const existing = await listWorkspacesByUser(userId);
  if (existing.length > 0) {
    return existing;
  }
  await createWorkspace(userId, "Default");
  return listWorkspacesByUser(userId);
}
