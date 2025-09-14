"use client";

import { useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { PromptPanel } from "@/components/prompt-panel";
import { Navigation } from "@/components/navigation";
import { TaskHeader } from "@/components/task-header";
import { EditorProvider } from "@/components/editor-context";
import { FileSystemSidebar } from "@/components/file-system-sidebar";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Navigation Bar */}
      <Navigation />

      {/* Task Header */}
      <TaskHeader sessionId={sessionId || ''} />

      {/* Main Content Area */}
      <EditorProvider>
        <div className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
          {/* File System Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FileSystemSidebar sessionId={sessionId || ''} />
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-w-0">
            <CodeEditor sessionId={sessionId || ''} />
          </div>

          {/* Prompt Panel */}
          <div className="w-96 flex-shrink-0">
            <PromptPanel sessionId={sessionId || ''} />
          </div>
        </div>
      </EditorProvider>
    </div>
  );
}