"use client";

import { useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { PromptPanel } from "@/components/prompt-panel";
import { Navigation } from "@/components/navigation";
import { TaskHeader } from "@/components/task-header";
import { EditorProvider } from "@/components/editor-context";
import { FileSystemSidebar } from "@/components/file-system-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  return (
    <AuthGuard>
      <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-light">
        {/* Navigation Bar */}
        <Navigation />

        {/* Task Header */}
        <TaskHeader sessionId={sessionId || ''} />

        {/* Main Content Area */}
        <EditorProvider>
          <div className="flex-1 flex overflow-hidden">
            {/* File System Sidebar */}
            <FileSystemSidebar sessionId={sessionId || ''} />

            {/* Monaco Code Editor */}
            <div className="flex-1 border-r border-gray-800 min-h-0">
              <CodeEditor />
            </div>

            {/* Right Panel - Prompt Writing */}
            <div className="w-96 flex flex-col">
              <PromptPanel sessionId={sessionId || ''} />
            </div>
          </div>
        </EditorProvider>
      </div>
    </AuthGuard>
  );
}