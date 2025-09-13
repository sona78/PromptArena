'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  execution_time?: number;
}

interface EditorContextType {
  code: string;
  setCode: (code: string) => void;
  language: 'javascript' | 'python';
  setLanguage: (language: 'javascript' | 'python') => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  executionResult: ExecutionResult | null;
  setExecutionResult: (result: ExecutionResult | null) => void;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const getDefaultCode = (language: 'javascript' | 'python') => {
  if (language === 'javascript') {
    return `// Hello World in JavaScript
console.log('Hello, World!');

// Example function
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('JavaScript'));`;
  } else {
    return `# Hello World in Python
print('Hello, World!')

# Example function
def greet(name):
    return f'Hello, {name}!'

print(greet('Python'))`;
  }
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'javascript' | 'python'>('python');
  const [code, setCode] = useState(getDefaultCode('python'));
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const setLanguage = (newLanguage: 'javascript' | 'python') => {
    setLanguageState(newLanguage);
    setCode(getDefaultCode(newLanguage));
  };

  return (
    <EditorContext.Provider value={{
      code,
      setCode,
      language,
      setLanguage,
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
