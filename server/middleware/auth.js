import { getAuth } from "@clerk/express";

export function requireAuth(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

export async function requireWorkspaceAccess(req, res, next) {
  const workspaceId = req.params.workspaceId;
  const { getWorkspaceById } = await import(
    "../repositories/workspace.repository.js"
  );
  const workspace = await getWorkspaceById(workspaceId, req.userId);
  if (!workspace) {
    return res.status(404).json({ error: "Workspace not found" });
  }
  req.workspace = workspace;
  next();
}
 