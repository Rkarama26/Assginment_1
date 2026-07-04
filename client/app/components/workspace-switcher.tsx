"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useWorkspace } from "@/app/context/workspace-context";

export default function WorkspaceSwitcher() {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    createNewWorkspace,
  } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await createNewWorkspace(name);
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Workspace
      </label>
      <div className="relative">
        <select
          value={activeWorkspace?.id ?? ""}
          onChange={(e) => setActiveWorkspaceId(e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 pr-10 text-sm text-white"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workspace name"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
        >
          <Plus className="h-4 w-4" />
          New workspace
        </button>
      )}
    </div>
  );
}
