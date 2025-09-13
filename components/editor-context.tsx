'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  execution_time?: number;
}

interface EditorContextType {
  code: string;
  setCode: (code: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  executionResult: ExecutionResult | null;
  setExecutionResult: (result: ExecutionResult | null) => void;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  return (
    <EditorContext.Provider value={{ 
      code, 
      setCode, 
      isLoading, 
      setIsLoading, 
      executionResult, 
      setExecutionResult, 
      isExecuting, 
      setIsExecuting 
    }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
