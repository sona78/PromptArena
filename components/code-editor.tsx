'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Copy, FileText } from "lucide-react";

export function CodeEditor() {
  const [code, setCode] = useState(`# Creative Writing Prompt Generator

## Task Description
Generate a compelling short story prompt that encourages creativity and originality.

## Requirements
- Must be under 100 words
- Should inspire unique storytelling
- Include specific constraints or elements
- Encourage emotional depth

## Example Output
"Write a story about a librarian who discovers that books in their library are portals to the worlds they contain. However, each time someone enters a book, a character from that story enters our world. Today, three books were left open overnight."

## Your Prompt
[Write your creative writing prompt here]
`);

  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    // Simulate running the prompt
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Editor Toolbar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">prompt-task.md</span>
          </div>
          
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            Markdown
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
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
            onClick={() => setCode('')}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleRun}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? 'Testing...' : 'Test Prompt'}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="markdown"
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
          }}
        />
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
          <span>Words: {code.split(/\s+/).filter(word => word.length > 0).length}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-gray-800 text-gray-300 text-xs">
            Markdown
          </Badge>
        </div>
      </div>
    </div>
  );
}
