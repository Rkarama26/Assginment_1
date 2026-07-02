import {
  createWorkspace,
  ensureDefaultWorkspace,
  updateWorkspace,
} from "../repositories/workspace.repository.js";

export async function listWorkspaces(req, res) {
  const workspaces = await ensureDefaultWorkspace(req.userId);
  res.json({ workspaces });
}

export async function createWorkspaceHandler(req, res) {
  const name = req.body?.name?.trim();
  if (!name) {
    return res.status(400).json({ error: "Workspace name is required" });
  }
  const workspace = await createWorkspace(req.userId, name);
  res.status(201).json({ workspace });
}

export async function getWorkspace(req, res) {
  res.json({ workspace: req.workspace });
}

export async function updateWorkspaceHandler(req, res) {
  const name = req.body?.name?.trim();
  if (!name) {
    return res.status(400).json({ error: "Workspace name is required" });
  }
  const workspace = await updateWorkspace(
    req.params.workspaceId,
    req.userId,
    name,
  );
  if (!workspace) {
    return res.status(404).json({ error: "Workspace not found" });
  }
  res.json({ workspace });
}
