import dotenv from "dotenv";

dotenv.config();

const SUPPORTED_EMBEDDING_DIMENSIONS = [768, 1536, 3072];

function normalizeEmbeddingDimensions(value) {
  const parsed = Number(value);
  if (SUPPORTED_EMBEDDING_DIMENSIONS.includes(parsed)) {
    return parsed;
  }
  return 1536;
}

export const env = {
  port: Number(process.env.PORT) || 8000,
  databaseUrl: process.env.DATABASE_URL,
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  qdrantUrl: process.env.QDRANT_URL || "http://localhost:6333",
  qdrantCollection: process.env.QDRANT_COLLECTION || "rag_chunks",
  googleApiKey: process.env.GOOGLE_API_KEY,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishable: process.env.CLERK_PUBLISHABLE_KEY,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  redisUrl: process.env.REDIS_URL,
  embeddingDimensions: normalizeEmbeddingDimensions(
    process.env.EMBEDDING_DIMENSIONS,
  ),
  vectorStoreTableName:
    process.env.PGVECTOR_TABLE_NAME || "document_embeddings",
};

export function assertRequiredEnv() {
  if (!env.googleApiKey) {
    throw new Error("GOOGLE_API_KEY is required for embeddings");
  }
  const key = env.googleApiKey;
  if (!key.startsWith("AIza") && !key.startsWith("AQ.")) {
    throw new Error(
      "GOOGLE_API_KEY must be a Gemini API key from AI Studio (starts with AIza or AQ.). " +
        "Create one at https://aistudio.google.com/apikey",
    );
  }
  if (!env.clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY is required for authentication");
  }
}
