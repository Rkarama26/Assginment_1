import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  Show,
  UserButton,
} from "@clerk/nextjs";
import { WorkspaceProvider } from "./context/workspace-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workspace RAG Assistant",
  description: "Grounded document Q&A with workspace isolation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-slate-950 text-slate-100">
          <WorkspaceProvider>
            <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
                  R
                </div>
                <span className="text-sm font-semibold text-white">
                  RAG Workspace
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </header>
            {children}
          </WorkspaceProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
