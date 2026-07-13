import { QdrantVectorStore } from "@langchain/qdrant";
import { geminiEmbeddings } from "../ai/embedding.js";
import { env } from "../config/env.js";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

// rag_chunks
const VECTOR_STORE_COLLECTION_NAME = env.qdrantCollection;
// chache promise - prevents multiple connections to Qdrant when multiple requests come in at the same time
let vectorStorePromise = null;



// build the config for the QdrantVectorStore
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

export async function getPgVector_Store() {
  if (!vectorStorePromise) {
    vectorStorePromise = PGVectorStore.initialize(geminiEmbeddings, {
      postgresConnectionOptions: {
        connectionString: env.databaseUrl,
      },

      tableName: "chunks",

      columns: {
        idColumnName: "id",
        vectorColumnName: "embedding",
        contentColumnName: "content",
        metadataColumnName: "metadata",
      },
    });
  }

  return vectorStorePromise;
}

// ensure the collection exists and return the vector store
export async function ensureCollection(vectorSize = env.embeddingDimensions) {
  const vectorStore = await getPgVector_Store(vectorSize);
  await vectorStore.ensureCollection();
  return vectorStore;
}

// delete all vectors for a given documentId
export async function deleteDocumentVectors(documentId) {
  if (!documentId) {
    throw new Error("documentId is required to delete vectors");
  }

  const vectorStore = await getPgVector_Store();

  // PGVectorStore filter format: flat object matched against metadata JSONB keys
  await vectorStore.delete({
    filter: { documentId },
  });
}

//retrieval of vectors from the vector store based on a query vector and optional workspaceId
export async function searchVectorStore(queryVector, workspaceId, limit = 2) {
  if (!workspaceId) {
    // never allow an unscoped search across all workspaces
    throw new Error("workspaceId is required for scoped retrieval");
  }
  const vectorStore = await getPgVector_Store();
  const results = await vectorStore.similaritySearchVectorWithScore(
    queryVector,
    limit,
    { workspaceId },
  );
  // console.log("results from searchVectorStore:", results);
  return results.map(([document, distance]) => ({
    score: 1 - distance,
    payload: {
      content: document.pageContent,
      metadata: document.metadata,
    },
  }));
}
