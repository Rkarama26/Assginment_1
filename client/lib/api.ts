const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Workspace = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DocumentRecord = {
  id: string;
  workspace_id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type Citation = {
  documentId: string;
  filename: string;
  chunkIndex: number;
  excerpt: string;
  score: number;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  created_at: string;
};

export type Conversation = {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
};

export type ToolCallRecord = {
  id: string;
  workspace_id: string;
  message_id: string | null;
  tool_name: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: "success" | "error";
  error_message: string | null;
  created_at: string;
};

async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data as T;
}

export async function fetchWorkspaces(token: string | null) {
  return apiFetch<{ workspaces: Workspace[] }>("/api/workspaces", token);
}

export async function createWorkspace(token: string | null, name: string) {
  return apiFetch<{ workspace: Workspace }>("/api/workspaces", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function fetchDocuments(
  token: string | null,
  workspaceId: string,
) {
  return apiFetch<{ documents: DocumentRecord[] }>(
    `/api/workspaces/${workspaceId}/documents`,
    token,
  );
}

export async function uploadPdf(
  token: string | null,
  workspaceId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("pdf", file);

  return apiFetch<{
    message: string;
    document: DocumentRecord;
    reindexed: boolean;
  }>(`/api/workspaces/${workspaceId}/upload/pdf`, token, {
    method: "POST",
    body: formData,
  });
}

export async function sendChatMessage(
  token: string | null,
  workspaceId: string,
  message: string,
  conversationId?: string | null,
  retry = false,
) {
  return apiFetch<{
    conversation: Conversation;
    message: ChatMessage;
    toolCalls: ToolCallRecord[];
    error?: string;
    canRetry?: boolean;
  }>(`/api/workspaces/${workspaceId}/chat`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      retry
        ? { conversationId, retry: true }
        : { message, conversationId },
    ),
  });
}

export async function fetchConversationMessages(
  token: string | null,
  workspaceId: string,
  conversationId: string,
) {
  return apiFetch<{ conversation: Conversation; messages: ChatMessage[] }>(
    `/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
    token,
  );
}

export async function fetchToolCalls(
  token: string | null,
  workspaceId: string,
) {
  return apiFetch<{ toolCalls: ToolCallRecord[] }>(
    `/api/workspaces/${workspaceId}/tool-calls`,
    token,
  );
}

export async function fetchConversations(
  token: string | null,
  workspaceId: string,
) {
  return apiFetch<{ conversations: Conversation[] }>(
    `/api/workspaces/${workspaceId}/conversations`,
    token,
  );
}
