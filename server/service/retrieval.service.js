import { geminiEmbeddings } from "../ai/embedding.js";
import { env } from "../config/env.js";
import { searchVectorStore } from "./vector.service.js";

export const SCORE_THRESHOLD = 0.55;
export const TOP_K = 3;

/**
 * @param {string} workspaceId
 * @param {string} query
 */
export async function retrieveWorkspaceChunks(workspaceId, query) {
  // query to vector embedding
  const vector = await geminiEmbeddings.embedQuery(query);

  const results = await searchVectorStore(vector, workspaceId, TOP_K);

  //  console.log("results from rag-service:", results);
  return results
    .filter((hit) => hit.score >= SCORE_THRESHOLD)
    .map((hit) => ({
      score: hit.score,
      content: hit.payload?.content ?? "",
      documentId: hit.payload?.metadata?.documentId ?? "",
      filename: hit.payload?.metadata?.filename ?? "unknown",
      chunkIndex: hit.payload?.metadata?.chunkIndex ?? 0,
    }));
}

export function formatContextBlock(chunks) {
  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] Source: ${chunk.filename} (chunk ${chunk.chunkIndex})\n"""${chunk.content.trim()}"""`,
    )
    .join("\n\n");
}

export function chunksToCitations(chunks) {
  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    filename: chunk.filename,
    chunkIndex: chunk.chunkIndex,
    excerpt: chunk.content.slice(0, 200),
    score: chunk.score,
  }));
}
