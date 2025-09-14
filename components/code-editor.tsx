'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Copy, FileText, Save } from "lucide-react";
import { useEditor } from "./editor-context";
import { ResultsPanel } from "./results-panel";

export function CodeEditor() {
  const {
    code,
    setCode,
    language,
    activeFile,
    saveFile,
    isLoading,
    executionResult,
    setExecutionResult,
    isExecuting,
    setIsExecuting,
    isSaving,
    hasUnsavedChanges
  } = useEditor();

  const handleRun = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language
        }),
      });

      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        output: '',
        error: 'Failed to execute code: Network error'
      });
    } finally {
      setIsExecuting(false);
    }
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
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
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
        {!activeFile && !code ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No file selected</h3>
              <p className="text-sm">Select a file from the sidebar to start editing</p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage={activeFile ? getMonacoLanguage(activeFile.language) : 'plaintext'}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
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
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          <span>Words: {code.split(/\s+/).filter(word => word.length > 0).length}</span>
        </div>

        <div className="flex items-center space-x-2">
          {activeFile && (
            <Badge className="bg-gray-800 text-gray-300 text-xs">
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
