import { pool } from "../config/db.js";

export async function listDocumentsByWorkspace(workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, filename, status, chunk_count, error_message, created_at, updated_at
     FROM documents
     WHERE workspace_id = $1
     ORDER BY created_at DESC`,
    [workspaceId],
  );
  return rows;
}

export async function getDocumentById(documentId, workspaceId) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, filename, status, chunk_count, error_message, created_at, updated_at
     FROM documents
     WHERE id = $1 AND workspace_id = $2`,
    [documentId, workspaceId],
  );
  return rows[0] ?? null;
}

export async function findDocumentByHash(workspaceId, contentHash) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, filename, storage_path, status, chunk_count
     FROM documents
     WHERE workspace_id = $1 AND content_hash = $2`,
    [workspaceId, contentHash],
  );
  return rows[0] ?? null;
}

export async function createDocument({
  workspaceId,
  filename,
  storagePath,
  contentHash,
}) {
  const { rows } = await pool.query(
    `INSERT INTO documents (workspace_id, filename, storage_path, content_hash, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, workspace_id, filename, status, chunk_count, error_message, created_at, updated_at`,
    [workspaceId, filename, storagePath, contentHash],
  );
  return rows[0];
}

export async function updateDocumentForReupload(documentId, storagePath) {
  const { rows } = await pool.query(
    `UPDATE documents
     SET storage_path = $2, status = 'pending', chunk_count = 0, error_message = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING id, workspace_id, filename, status, chunk_count, error_message, created_at, updated_at`,
    [documentId, storagePath],
  );
  return rows[0];
}

export async function setDocumentStatus(documentId, status, extra = {}) {
  const { chunkCount, errorMessage } = extra;
  const { rows } = await pool.query(
    `UPDATE documents
     SET status = $2,
         chunk_count = COALESCE($3, chunk_count),
         error_message = $4,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, workspace_id, filename, status, chunk_count, error_message, created_at, updated_at`,
    [documentId, status, chunkCount ?? null, errorMessage ?? null],
  );
  return rows[0];
}
