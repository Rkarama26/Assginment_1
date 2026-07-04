import crypto from "crypto";
import fs from "fs";
import { getFileQueue } from "../queue/queue.js";
import { checkRedisConnection } from "../config/redis.js";
import {
  createDocument,
  findDocumentByHash,
  updateDocumentForReupload,
} from "../repositories/document.repository.js";
import { deleteDocumentVectors } from "../service/qdrant.service.js";

function hashFile(path) {
  const buffer = fs.readFileSync(path);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function uploadPdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "PDF file is required" });
  }

  const contentHash = hashFile(req.file.path);
  const existing = await findDocumentByHash(
    req.params.workspaceId,
    contentHash,
  );

  let document;

  if (existing) {
    try {
      await deleteDocumentVectors(existing.id);
    } catch {
      // Qdrant may be temporarily unavailable; worker will clean up on re-index
    }
    document = await updateDocumentForReupload(existing.id, req.file.path);
  } else {
    document = await createDocument({
      workspaceId: req.params.workspaceId,
      filename: req.file.originalname,
      storagePath: req.file.path,
      contentHash,
    });
  }

  const redisOk = await checkRedisConnection();
  if (!redisOk) {
    return res.status(503).json({
      error:
        "Upload queue unavailable. Start Redis/Valkey: docker compose up -d valkey",
    });
  }

  await getFileQueue().add(
    "process-document",
    {
      documentId: document.id,
      workspaceId: req.params.workspaceId,
      filename: req.file.originalname,
      path: req.file.path,
    },
    {
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  res.status(existing ? 200 : 201).json({
    message: existing
      ? "Document re-uploaded; re-indexing started"
      : "Document uploaded; indexing started",
    document,
    reindexed: Boolean(existing),
  });
}
