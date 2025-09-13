"use client";

import { useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { PromptPanel } from "@/components/prompt-panel";
import { Navigation } from "@/components/navigation";
import { TaskHeader } from "@/components/task-header";
import { EditorProvider, useEditor } from "@/components/editor-context";
import { FileSystemSidebar } from "@/components/file-system-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function LanguageToggle() {
  const { language, setLanguage } = useEditor();

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Language:</span>
        <div className="flex items-center space-x-1">
          <Button
            variant={language === 'javascript' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('javascript')}
            className={language === 'javascript'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }
          >
            JavaScript
          </Button>
          <Button
            variant={language === 'python' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('python')}
            className={language === 'python'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }
          >
            Python
          </Button>
        </div>
      </div>
      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
        {language === 'javascript' ? 'JS' : 'PY'}
      </Badge>
    </div>
  );
}

export default function EditorPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        {/* Navigation Bar */}
        <Navigation />

        {/* Task Header */}
        <TaskHeader />

        {/* Main Content Area */}
        <EditorProvider>
          <div className="flex-1 flex overflow-hidden">
            {/* File System Sidebar */}
            <FileSystemSidebar sessionId={sessionId || ''} />

            {/* Monaco Code Editor */}
            <div className="flex-1 border-r border-gray-800">
              <LanguageToggle />
              <CodeEditor />
            </div>

            {/* Right Panel - Prompt Writing */}
            <div className="w-96 flex flex-col">
              <PromptPanel />
            </div>
          </div>
        </EditorProvider>
      </div>
    </AuthGuard>
  );
}