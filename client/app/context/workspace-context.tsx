"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/nextjs";
import {
  createWorkspace,
  fetchDocuments,
  fetchWorkspaces,
  type DocumentRecord,
  type Workspace,
} from "@/lib/api";

type WorkspaceContextValue = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  documents: DocumentRecord[];
  loading: boolean;
  error: string | null;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  createNewWorkspace: (name: string) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "active-workspace-id";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(
    null,
  );
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  );

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const token = await getToken();
    const data = await fetchWorkspaces(token);
    setWorkspaces(data.workspaces);

    const storedId = localStorage.getItem(STORAGE_KEY);
    const nextId =
      data.workspaces.find((w) => w.id === storedId)?.id ??
      data.workspaces[0]?.id ??
      null;

    if (nextId) {
      setActiveWorkspaceId(nextId);
    }
  }, [getToken, setActiveWorkspaceId]);

  const refreshDocuments = useCallback(async () => {
    if (!activeWorkspaceId) {
      setDocuments([]);
      return;
    }

    const token = await getToken();
    const data = await fetchDocuments(token, activeWorkspaceId);
    setDocuments(data.documents);
  }, [activeWorkspaceId, getToken]);

  const createNewWorkspace = useCallback(
    async (name: string) => {
      const token = await getToken();
      const data = await createWorkspace(token, name);
      await refreshWorkspaces();
      setActiveWorkspaceId(data.workspace.id);
    },
    [getToken, refreshWorkspaces, setActiveWorkspaceId],
  );

  useEffect(() => {
    if (!isSignedIn) {
      setWorkspaces([]);
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    refreshWorkspaces()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isSignedIn, refreshWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId || !isSignedIn) {
      return;
    }

    refreshDocuments().catch((err: Error) => setError(err.message));

    const interval = setInterval(() => {
      refreshDocuments().catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [activeWorkspaceId, isSignedIn, refreshDocuments]);

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      documents,
      loading,
      error,
      setActiveWorkspaceId,
      refreshWorkspaces,
      refreshDocuments,
      createNewWorkspace,
    }),
    [
      workspaces,
      activeWorkspace,
      documents,
      loading,
      error,
      setActiveWorkspaceId,
      refreshWorkspaces,
      refreshDocuments,
      createNewWorkspace,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
