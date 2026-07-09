import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { setDocumentStatus } from "../repositories/document.repository.js";
import { deleteDocumentVectors, getPgVector_Store } from "./vector.service.js";

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
    console.time("load");
    const docs = await loader.load();
    console.timeEnd("load");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    console.time("split"); 
    const chunks = await splitter.splitDocuments(docs);
    console.timeEnd("split");  
 
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
     * @dev store embeddings into the Qdrant-backed store
     */
    console.time("embed");
    const vectorStore = await getPgVector_Store();
    console.timeEnd("embed");
    console.log("chunks length:", chunks.length);
    if (chunks.length > 0) {
      console.time("upsert");
      // console.log(vectorStore.constructor.name);
      await vectorStore.addDocuments(chunks);
      console.log("upserted chunks length in pgvector:", chunks.length);
      console.timeEnd("upsert");
    }

    await setDocumentStatus(documentId, "ready", {
      chunkCount: chunks.length,
    });

    return { chunkCount: chunks.length };
  } catch (error) {
    const message = error.message ?? String(error);
    if (message.includes("401") || message.includes("UNAUTHENTICATED")) {
      await setDocumentStatus(documentId, "failed", {
        errorMessage:
          "Gemini API authentication failed. Check GOOGLE_API_KEY in server/.env and restart the worker.",
      });
    } else {
      await setDocumentStatus(documentId, "failed", {
        errorMessage: message.slice(0, 500),
      });
    }
    throw error;
  }
}
