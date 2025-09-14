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
              onClick={() => saveFile()}
              disabled={isLoading || isSaving || !hasUnsavedChanges}
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
            size="sm"
            className="bg-[#00656B] hover:bg-[#00656B]/80 text-white"
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

      {/* Status Bar */}
      <div className="bg-[#C5AECF]/10 border-t border-[#79797C] px-4 py-2 flex items-center justify-between text-xs text-[#79797C] flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          <span>Words: {code.split(/\s+/).filter(word => word.length > 0).length}</span>
        </div>

        <div className="flex items-center space-x-2">
          {activeFile && (
            <Badge className="bg-[#C5AECF]/20 text-[#28282D] text-xs">
              {activeFile.language.charAt(0).toUpperCase() + activeFile.language.slice(1)}
            </Badge>
          )}
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex-shrink-0">
        <ResultsPanel result={executionResult} isRunning={isExecuting} />
      </div>
    </div>
  );
}
