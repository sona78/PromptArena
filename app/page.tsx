'use client';

import { CodeEditor } from "@/components/code-editor";
import { PromptPanel } from "@/components/prompt-panel";
import { Navigation } from "@/components/navigation";
import { TaskHeader } from "@/components/task-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <Navigation />
      
      {/* Task Header */}
      <TaskHeader />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Monaco Code Editor */}
        <div className="flex-1 border-r border-gray-800">
          <CodeEditor />
        </div>
        
        {/* Right Panel - Prompt Writing */}
        <div className="w-96 flex flex-col">
          <PromptPanel />
        </div>
      </div>
    </div>
  );
}
