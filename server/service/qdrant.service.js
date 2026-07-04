import { QdrantVectorStore } from "@langchain/qdrant";
import { geminiEmbeddings } from "../ai/embedding.js";
import { env } from "../config/env.js";

const VECTOR_STORE_COLLECTION_NAME = env.qdrantCollection;
let vectorStorePromise = null;

export function resolveVectorDimensions(value) {
  const parsed = Number(value);
  if ([768, 1536, 3072].includes(parsed)) {
    return parsed;
  }
  return env.embeddingDimensions;
}

function buildVectorStoreConfig(dimensions) {
  return {
    url: env.qdrantUrl,
    collectionName: VECTOR_STORE_COLLECTION_NAME,
    collectionConfig: {
      vectors: {
        size: resolveVectorDimensions(dimensions),
        distance: "Cosine",
      },
    },
  };
}

export async function getVectorStore(dimensions = env.embeddingDimensions) {
  if (!vectorStorePromise) {
    vectorStorePromise = (async () => {
      const vectorStore = new QdrantVectorStore(
        geminiEmbeddings,
        buildVectorStoreConfig(dimensions),
      );
      await vectorStore.ensureCollection();
      return vectorStore;
    })();
  }

  return vectorStorePromise;
}

export async function ensureCollection(vectorSize = env.embeddingDimensions) {
  const vectorStore = await getVectorStore(vectorSize);
  await vectorStore.ensureCollection();
  return vectorStore;
}

export async function deleteDocumentVectors(documentId) {
  const vectorStore = await getVectorStore();
  await vectorStore.delete({
    filter: {
      must: [
        {
          key: "metadata.documentId",
          match: { value: documentId },
        },
      ],
    },
  });
}

export async function searchVectorStore(queryVector, workspaceId, limit = 2) {
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearchVectorWithScore(
    queryVector,
    limit,
    workspaceId
      ? {
          must: [
            {
              key: "metadata.workspaceId",
              match: { value: workspaceId },
            },
          ],
        }
      : undefined,
  );

  return results.map(([document, score]) => ({
    score,
    payload: {
      content: document.pageContent,
      metadata: document.metadata,
    },
  }));
}

export const qdrantClient = {
  async search(_collectionName, options = {}) {
    const vector = options.vector ?? [];
    const workspaceId = options.filter?.must?.find(
      (entry) => entry.key === "metadata.workspaceId",
    )?.match?.value;

    return searchVectorStore(vector, workspaceId, options.limit ?? 2);
  },
};
