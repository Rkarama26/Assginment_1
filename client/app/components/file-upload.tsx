"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useWorkspace } from "@/app/context/workspace-context";
import { uploadPdf } from "@/lib/api";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function FileUploadComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();
  const { activeWorkspace, refreshDocuments } = useWorkspace();
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";

    if (!file || !activeWorkspace) {
      return;
    }

    if (file.type !== "application/pdf") {
      setState("error");
      setMessage("Only PDF files are supported.");
      return;
    }

    setState("uploading");
    setMessage(null);

    try {
      const token = await getToken();
      const result = await uploadPdf(token, activeWorkspace.id, file);
      setState("success");
      setMessage(result.message);
      await refreshDocuments();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={!activeWorkspace || state === "uploading"}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && inputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            inputRef.current.files = dt.files;
            inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/80 p-8 text-white transition hover:border-violet-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "uploading" ? (
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        ) : (
          <Upload className="h-8 w-8 text-violet-400" />
        )}
        <div className="text-center">
          <p className="font-medium">Upload PDF</p>
          <p className="mt-1 text-sm text-slate-400">
            Click or drag a file into this area
          </p>
        </div>
      </button>

      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
            state === "error"
              ? "bg-red-500/10 text-red-300"
              : "bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {state === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
