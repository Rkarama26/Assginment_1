"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Dashboard from "./components/dashboard";

export default function HomePage() {
  return (
    <>
      <Show when="signed-out">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
            Workspace-scoped RAG
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ask questions grounded in your documents
          </h1>
          <p className="mt-4 max-w-xl text-slate-400">
            Upload PDFs per workspace, chat with citations, and let the
            assistant take actions — all with strict isolation in a shared
            vector store.
          </p>
          <SignInButton>
            <button className="mt-8 rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-violet-500">
              Sign in to continue
            </button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <Dashboard />
      </Show>
    </>
  );
}
