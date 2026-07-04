"use client";

import { useState } from "react";
import { FileText, MessageSquare, Wrench } from "lucide-react";
import WorkspaceSwitcher from "./workspace-switcher";
import FileUploadComponent from "./file-upload";
import DocumentList from "./document-list";
import ChatPanel from "./chat-panel";
import ToolCallLog from "./tool-call-log";
import { useWorkspace } from "@/app/context/workspace-context";

type Tab = "chat" | "documents" | "tools";

const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "tools", label: "Tool calls", icon: Wrench },
];

export default function Dashboard() {
  const { loading, error } = useWorkspace();
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl">
      <aside className="hidden w-[300px] shrink-0 flex-col border-r border-slate-800 p-5 lg:flex">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-white">Knowledge Base</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Upload PDFs into a workspace. Retrieval is always scoped to the
            active workspace in the shared vector store.
          </p>
        </div>

        <WorkspaceSwitcher />
        <div className="mt-6">
          <FileUploadComponent />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </p>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex border-b border-slate-800 px-4 lg:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition ${
                activeTab === id
                  ? "border-violet-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 lg:p-6">
          {loading ? (
            <p className="text-sm text-slate-400">Loading workspace…</p>
          ) : (
            <>
              {activeTab === "chat" && <ChatPanel />}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="lg:hidden space-y-4">
                    <WorkspaceSwitcher />
                    <FileUploadComponent />
                  </div>
                  <DocumentList />
                </div>
              )}
              {activeTab === "tools" && <ToolCallLog />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
