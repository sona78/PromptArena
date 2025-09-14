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
    saveError,
    setSaveError,
    lastSaveTime,
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

    // Always force save current file before execution to ensure latest changes are persisted
    if (activeFile) {
      console.log('Force saving file before test execution:', activeFile.name);
      await saveFile();

      // Wait a brief moment to ensure the save operation completes
      await new Promise(resolve => setTimeout(resolve, 100));
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
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Editor Toolbar */}
      <div className="bg-[#C5AECF]/10 border-b border-[#79797C] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#79797C]" />
            <span className="text-sm font-medium text-[#28282D]">
              {activeFile ? activeFile.name : 'No file selected'}
            </span>
            {hasUnsavedChanges && !isSaving && (
              <span className="text-xs text-[#D79D00]" title="Unsaved changes">•</span>
            )}
            {isSaving && (
              <span className="text-xs text-[#3073B7] animate-pulse" title="Auto-saving...">💾</span>
            )}
            {saveError && (
              <span className="text-xs text-red-500" title={saveError}>⚠️</span>
            )}
            {lastSaveTime && !hasUnsavedChanges && !saveError && (
              <span className="text-xs text-green-500" title={`Last saved: ${new Date(lastSaveTime).toLocaleTimeString()}`}>✓</span>
            )}
          </div>
          {activeFile && (
            <Badge variant="outline" className="text-xs border-[#79797C] text-[#79797C]">
              {activeFile.language.toUpperCase()}
            </Badge>
          )}

          {isLoading && (
            <Badge className="bg-[#3073B7]/10 text-[#3073B7] text-xs animate-pulse">
              Generating...
            </Badge>
          )}

          {isSaving && (
            <Badge className="bg-[#00656B]/10 text-[#00656B] text-xs animate-pulse">
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
              onClick={() => {
                setSaveError(null);
                saveFile();
              }}
              disabled={isLoading || isSaving || (!hasUnsavedChanges && !saveError)}
              title={saveError ? 'Retry save' : hasUnsavedChanges ? 'Save file' : 'No changes to save'}
            >
              <Save className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-[#79797C] hover:text-[#28282D] hover:bg-[#C5AECF]/20"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-[#79797C] hover:text-[#28282D] hover:bg-[#C5AECF]/20"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            className="bg-[#00656B] hover:bg-[#00656B]/80 text-white font-display-serif font-bold tracking-wide text-sm px-4 py-2"
            onClick={handleRun}
            disabled={isExecuting || isLoading}
          >
            <Play className="w-4 h-4 mr-1" />
            {isExecuting ? 'RUNNING...' : 'TEST PROMPT'}
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
        <div className="border-t border-[#79797C] bg-white">
          <div className="px-4 py-2 bg-[#C5AECF]/10 border-b border-[#79797C] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#00656B]"></div>
              <span className="text-sm font-medium text-[#28282D]">Live Preview</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#79797C] hover:text-[#28282D]"
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
      <div className="bg-[#C5AECF]/10 border-t border-[#79797C] px-4 py-2 flex items-center justify-between text-xs text-[#79797C]">
        <div className="flex items-center space-x-4">
          {saveError ? (
            <span className="text-red-500 font-medium">{saveError}</span>
          ) : isSaving ? (
            <span className="text-[#3073B7]">Auto-saving...</span>
          ) : hasUnsavedChanges ? (
            <span className="text-[#D79D00]">Unsaved changes</span>
          ) : lastSaveTime ? (
            <span className="text-green-600">Saved at {new Date(lastSaveTime).toLocaleTimeString()}</span>
          ) : (
            <span>Ready</span>
          )}
          {activeFile && (
            <span>Language: {activeFile.language}</span>
          )}
          {taskType === 1 && htmlOutput && (
            <span className="text-[#00656B]">• Live Preview Active</span>
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
