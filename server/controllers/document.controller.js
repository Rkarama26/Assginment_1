import {
  getDocumentById,
  listDocumentsByWorkspace,
} from "../repositories/document.repository.js";

export async function listDocuments(req, res) {
  const documents = await listDocumentsByWorkspace(req.params.workspaceId);
  res.json({ documents });
}

export async function getDocument(req, res) {
  const document = await getDocumentById(
    req.params.documentId,
    req.params.workspaceId,
  );
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json({ document });
}
