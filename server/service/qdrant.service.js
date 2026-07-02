import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.js";

/**
 * @description - ensure vector exists, if not it creates new vector with
 */

const client = new QdrantClient({ url: env.qdrantUrl });
/**
 * @param {number} vectorSize
 */
export async function ensureCollection(vectorSize = 768) {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === env.qdrantCollection,
  );

  if (!exists) {
    await client.createCollection(env.qdrantCollection, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
  }
  // indexing
  await client
    .createPayloadIndex(env.qdrantCollection, {
      field_name: "metadata.workspaceId",
      field_schema: "keyword",
    })
    .catch(() => {});

  await client
    .createPayloadIndex(env.qdrantCollection, {
      field_name: "metadata.documentId",
      field_schema: "keyword",
    })
    .catch(() => {});
}

/**
 * @description - delete documents
 * @param {number} documentId
 */
export async function deleteDocumentVectors(documentId) {
  await client.delete(env.qdrantCollection, {
    wait: true,
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

export { client as qdrantClient };
