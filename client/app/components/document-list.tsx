"use client";

import { FileText, Loader2 } from "lucide-react";
import { useWorkspace } from "@/app/context/workspace-context";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300",
  processing: "bg-blue-500/20 text-blue-300",
  ready: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
};

export default function DocumentList() {
  const { documents, activeWorkspace, loading } = useWorkspace();

  if (!activeWorkspace) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Documents</h2>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-400">No documents yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload a PDF to start indexing in {activeWorkspace.name}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700"
            >
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {doc.filename}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[doc.status]}`}
                    >
                      {doc.status}
                    </span>
                    {doc.status === "ready" && (
                      <span className="text-xs text-slate-400">
                        {doc.chunk_count} chunks
                      </span>
                    )}
                  </div>
                  {doc.error_message && (
                    <p className="mt-2 text-xs text-red-300">
                      {doc.error_message}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
