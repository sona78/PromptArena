'use client';

import React from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Copy, FileText, Save } from "lucide-react";
import { useEditor } from "./editor-context";
import { ResultsPanel } from "./results-panel";
import { useSearchParams } from 'next/navigation';

export function CodeEditor() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const {
    code,
    setCode,
    activeFile,
    saveFile,
    isLoading,
    executionResult,
    setExecutionResult,
    isExecuting,
    isSaving,
    hasUnsavedChanges,
    taskType,
    htmlOutput,
    executeMultiFile
  } = useEditor();

  const handleRun = async () => {
    if (!sessionId) {
      setExecutionResult({
        success: false,
        output: '',
        error: 'No session ID available'
      });
      return;
    }

    // Save current file before execution if there are unsaved changes
    if (activeFile && hasUnsavedChanges) {
      await saveFile();
    }

    // Execute all files in the session
    await executeMultiFile(sessionId);
  };

  const handleReset = () => {
    if (activeFile) {
      setCode(activeFile.content);
    } else {
      setCode('');
    }
  };

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return 'javascript';
      case 'python':
        return 'python';
      case 'text':
        return 'plaintext';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Editor Toolbar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">
              {activeFile ? activeFile.name : 'No file selected'}
            </span>
            {hasUnsavedChanges && !isSaving && (
              <span className="text-xs text-orange-400" title="Unsaved changes">•</span>
            )}
            {isSaving && (
              <span className="text-xs text-blue-400 animate-pulse" title="Auto-saving...">💾</span>
            )}
          </div>
          {activeFile && (
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              {activeFile.language.toUpperCase()}
            </Badge>
          )}

          {isLoading && (
            <Badge className="bg-blue-900 text-blue-200 text-xs animate-pulse">
              Generating...
            </Badge>
          )}

          {isSaving && (
            <Badge className="bg-green-900 text-green-200 text-xs animate-pulse">
              Auto-saving...
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeFile && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => saveFile()}
              disabled={isLoading || isSaving || !hasUnsavedChanges}
            >
              <Save className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="monaco-text-muted hover:monaco-text hover:bg-secondary/50"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="monaco-text-muted hover:monaco-text hover:bg-secondary/50"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleRun}
            disabled={isExecuting || isLoading}
          >
            <Play className="w-4 h-4 mr-1" />
            {isExecuting ? 'Running...' : 'Test Prompt'}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage={activeFile ? getMonacoLanguage(activeFile.language) : 'python'}
          value={code || '# Write your code here\n'}
          onChange={(value) => setCode(value || '')}
          theme="light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            renderLineHighlight: 'gutter',
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            readOnly: isLoading,
          }}
        />
      </div>

      {/* HTML/CSS Preview for Type 1 Challenges */}
      {taskType === 1 && htmlOutput && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Live Preview</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => window.open(`data:text/html,${encodeURIComponent(htmlOutput)}`, '_blank')}
            >
              Open in New Tab
            </Button>
          </div>
          <div className="h-96 overflow-hidden">
            <iframe
              srcDoc={htmlOutput}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="HTML/CSS Preview"
            />
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          {activeFile && (
            <span>Language: {activeFile.language}</span>
          )}
          {taskType === 1 && htmlOutput && (
            <span className="text-green-600">• Live Preview Active</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Ln 1, Col 1</span>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex-shrink-0">
        <ResultsPanel result={executionResult} isRunning={isExecuting} />
      </div>
    </div>
  );
}
