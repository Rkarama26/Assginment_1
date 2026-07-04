import { GoogleGenAI } from "@google/genai";
import { Embeddings } from "@langchain/core/embeddings";
import { env } from "../config/env.js";

const MODEL = "gemini-embedding-001";
const BATCH_SIZE = 100;

const ai = new GoogleGenAI({ apiKey: env.googleApiKey });

async function embedBatch(texts, taskType) {
  const result = await ai.models.embedContent({
    model: MODEL,
    contents: texts.map((text) => ({ parts: [{ text }] })),
    config: {
      taskType,
      outputDimensionality: env.embeddingDimensions,
    },
  });
  return result.embeddings.map((e) => e.values);
}

export class GeminiBatchEmbeddings extends Embeddings {
  async embedDocuments(texts) {
    const batches = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }

    const vectors = [];
    for (const batch of batches) {
      vectors.push(...(await embedBatch(batch, "RETRIEVAL_DOCUMENT")));
    }
    return vectors;
  }

  async embedQuery(text) {
    const [vector] = await embedBatch([text], "RETRIEVAL_QUERY");
    return vector;
  }
}

export const geminiEmbeddings = new GeminiBatchEmbeddings();
