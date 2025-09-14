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
      <div className="min-h-screen bg-white text-gray-900 flex flex-col">
        {/* Navigation Bar */}
        <Navigation />

        {/* Task Header */}
        <TaskHeader />

        {/* Main Content Area */}
        <EditorProvider>
          <div className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
            {/* File System Sidebar */}
            <div className="w-64 flex-shrink-0">
              <FileSystemSidebar sessionId={sessionId || ''} />
            </div>

            {/* Monaco Code Editor */}
            <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <CodeEditor />
            </div>

            {/* Right Panel - Prompt Writing */}
            <div className="w-80 flex-shrink-0">
              <PromptPanel sessionId={sessionId || ''} />
            </div>
          </div>
        </EditorProvider>
      </div>
    </AuthGuard>
  );
}