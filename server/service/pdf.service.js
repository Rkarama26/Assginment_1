import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import { geminiEmbeddings } from "../ai/embedding.js";
import { env } from "../config/env.js";
import { setDocumentStatus } from "../repositories/document.repository.js";
import { deleteDocumentVectors } from "./qdrant.service.js";

/**
 * @title - processPdf
 * @description - processPdf: takes an pdf file and make 
                  Documents out of it and than divide it 
                  into chunks
    
 * @returns {number} chunkCount                
 */

export async function processPdf(data) {
  const { documentId, workspaceId, filename, path } = data;

  await setDocumentStatus(documentId, "processing");

  try {
    const loader = new PDFLoader(path);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitDocuments(docs);

    chunks.forEach((chunk, index) => {
      chunk.metadata = {
        ...chunk.metadata,
        workspaceId,
        documentId,
        filename,
        chunkIndex: index,
      };
    });

    /**
     * @dev delete duplicate embeddings
     */
    await deleteDocumentVectors(documentId);

    /**
     * @dev store embeddings into qdrant vector store
     */
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      geminiEmbeddings,
      {
        url: env.qdrantUrl,
        collectionName: env.qdrantCollection,
      },
    );

    if (chunks.length > 0) {
      await vectorStore.addDocuments(chunks);
    }

    await setDocumentStatus(documentId, "ready", {
      chunkCount: chunks.length,
    });

    return { chunkCount: chunks.length };
  } catch (error) {
    await setDocumentStatus(documentId, "failed", {
      errorMessage: error.message,
    });
    throw error;
  }
}
