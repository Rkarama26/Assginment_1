"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "@/app/context/workspace-context";
import {
  fetchConversationMessages,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/api";

function conversationStorageKey(workspaceId: string) {
  return `chat-conversation-${workspaceId}`;
}

export default function ChatPanel() {
  const { getToken } = useAuth();
  const { activeWorkspace, refreshDocuments } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = useCallback(async () => {
    if (!activeWorkspace) return;

    const storedId = localStorage.getItem(
      conversationStorageKey(activeWorkspace.id),
    );
    setConversationId(storedId);
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);

    if (!storedId) return;

    setLoadingHistory(true);
    try {
      const token = await getToken();
      const data = await fetchConversationMessages(
        token,
        activeWorkspace.id,
        storedId,
      );
      setMessages(data.messages.filter((m) => m.content));
    } catch {
      localStorage.removeItem(conversationStorageKey(activeWorkspace.id));
      setConversationId(null);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeWorkspace, getToken]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function handleSend(retry = false) {
    const text = retry ? lastFailedMessage : input.trim();
    if (!text || !activeWorkspace || loading) return;
    if (!retry && !input.trim()) return;

    setLoading(true);
    setError(null);
    if (!retry) setLastFailedMessage(null);
    if (!retry) setInput("");

    const optimisticId = `temp-${Date.now()}`;
    if (!retry) {
      const optimisticUser: ChatMessage = {
        id: optimisticId,
        conversation_id: conversationId ?? "",
        role: "user",
        content: text,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);
    } else {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }

    try {
      const token = await getToken();
      const data = await sendChatMessage(
        token,
        activeWorkspace.id,
        text,
        conversationId,
        retry,
      );

      setConversationId(data.conversation.id);
      localStorage.setItem(
        conversationStorageKey(activeWorkspace.id),
        data.conversation.id,
      );

      setMessages((prev) => {
        const withoutOptimistic = retry
          ? prev
          : prev.filter((m) => m.id !== optimisticId);
        return [
          ...withoutOptimistic,
          ...(retry
            ? []
            : [
                {
                  id: `user-${data.message.id}`,
                  conversation_id: data.conversation.id,
                  role: "user" as const,
                  content: text,
                  citations: [],
                  created_at: new Date().toISOString(),
                },
              ]),
          data.message,
        ];
      });

      if (data.error) {
        setError(data.error);
        setLastFailedMessage(text);
      } else {
        setLastFailedMessage(null);
      }

      await refreshDocuments();
    } catch (err) {
      if (!retry) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
      setError(err instanceof Error ? err.message : "Failed to send message");
      setLastFailedMessage(text);
      if (!retry) setInput(text);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (!activeWorkspace) return;
    localStorage.removeItem(conversationStorageKey(activeWorkspace.id));
    setConversationId(null);
    setMessages([]);
    setError(null);
    setLastFailedMessage(null);
  }

  if (!activeWorkspace) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Assistant</h2>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          New chat
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4 min-h-[320px] max-h-[calc(100vh-18rem)]">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <MessageSquare className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm">Ask a question about your documents.</p>
            <p className="mt-1 text-xs text-slate-500">
              Answers are scoped to{" "}
              <span className="text-slate-300">{activeWorkspace.name}</span>{" "}
              only.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "border border-slate-700 bg-slate-800/80 text-slate-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && msg.citations?.length > 0 && (
                  <div className="mt-3 border-t border-slate-700 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Sources
                    </p>
                    <ul className="space-y-1.5">
                      {msg.citations.map((cite, i) => (
                        <li
                          key={`${cite.documentId}-${cite.chunkIndex}`}
                          className="rounded-lg bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-400"
                        >
                          <span className="font-medium text-violet-300">
                            [{i + 1}]
                          </span>{" "}
                          {cite.filename} · chunk {cite.chunkIndex}
                          <p className="mt-1 line-clamp-2 text-slate-500">
                            {cite.excerpt}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <span>{error}</span>
          {lastFailedMessage && (
            <button
              type="button"
              onClick={() => handleSend(true)}
              className="ml-3 flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-1 text-xs hover:bg-red-500/30"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your documents…"
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
