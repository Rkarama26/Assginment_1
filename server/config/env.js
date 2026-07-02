import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 8000,
  databaseUrl: process.env.DATABASE_URL,
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  qdrantUrl: process.env.QDRANT_URL || "http://localhost:6333",
  qdrantCollection: process.env.QDRANT_COLLECTION || "rag_chunks",
  googleApiKey: process.env.GOOGLE_API_KEY,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishable: process.env.CLERK_PUBLISHABLE_KEY,
};

export function assertRequiredEnv() {
  if (!env.googleApiKey) {
    throw new Error("GOOGLE_API_KEY is required for embeddings");
  }
  if (!env.clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY is required for authentication");
  }
}
