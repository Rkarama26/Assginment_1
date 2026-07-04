"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Wrench } from "lucide-react";
import { useWorkspace } from "@/app/context/workspace-context";
import { fetchToolCalls, type ToolCallRecord } from "@/lib/api";

export default function ToolCallLog() {
  const { getToken } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const token = await getToken();
      const data = await fetchToolCalls(token, activeWorkspace.id);
      setToolCalls(data.toolCalls);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace, getToken]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (!activeWorkspace) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white">Tool call log</h2>
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        )}
      </div>

      {toolCalls.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
          No tool calls yet. Ask the assistant to save a task or send a summary.
        </p>
      ) : (
        <ul className="space-y-3">
          {toolCalls.map((call) => (
            <li
              key={call.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-violet-300">
                  {call.tool_name}()
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    call.status === "success"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {call.status}
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950/60 p-2 text-xs text-slate-400">
                {JSON.stringify(call.arguments, null, 2)}
              </pre>
              {call.result && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950/60 p-2 text-xs text-slate-500">
                  → {JSON.stringify(call.result, null, 2)}
                </pre>
              )}
              {call.error_message && (
                <p className="mt-2 text-xs text-red-300">{call.error_message}</p>
              )}
              <p className="mt-2 text-xs text-slate-600">
                {new Date(call.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
