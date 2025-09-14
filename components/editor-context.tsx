'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/use-debounce';

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  execution_time?: number;
}

interface ActiveFile {
  name: string;
  path: string;
  content: string;
  language: 'javascript' | 'python' | 'text';
}

interface EditorContextType {
  code: string;
  setCode: (code: string) => void;
  language: 'javascript' | 'python';
  setLanguage: (language: 'javascript' | 'python') => void;
  activeFile: ActiveFile | null;
  setActiveFile: (file: ActiveFile | null) => void;
  openFile: (path: string, name: string) => Promise<void>;
  saveFile: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  executionResult: ExecutionResult | null;
  setExecutionResult: (result: ExecutionResult | null) => void;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
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

const getFileLanguage = (fileName: string): 'javascript' | 'python' | 'text' => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'javascript';
    case 'py':
    case 'pyw':
      return 'python';
    default:
      return 'text';
  }
};

export function EditorProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'javascript' | 'python'>('python');
  const [code, setCode] = useState('');
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const setLanguage = (newLanguage: 'javascript' | 'python') => {
    if (!activeFile) {
      setLanguageState(newLanguage);
    }
  };

  const openFile = async (path: string, name: string) => {
    try {
      setIsLoading(true);

      // If there's an active file with unsaved changes, save it first
      if (activeFile && hasUnsavedChanges) {
        await saveFile(true); // Skip UI state update for faster transition
      }

      const { data, error } = await supabase.storage
        .from('Sessions')
        .download(path);

      if (error) {
        throw error;
      }

      const content = await data.text();
      const fileLanguage = getFileLanguage(name);

      const file: ActiveFile = {
        name,
        path,
        content,
        language: fileLanguage
      };

      setActiveFile(file);
      setCode(content);

      if (fileLanguage !== 'text') {
        setLanguageState(fileLanguage);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      // Handle error - maybe show a toast or error message
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async (skipStateUpdate = false) => {
    if (!activeFile || isSaving) return;

    try {
      if (!skipStateUpdate) setIsSaving(true);

      const { error } = await supabase.storage
        .from('Sessions')
        .update(activeFile.path, new Blob([code], { type: 'text/plain' }));

      if (error) {
        throw error;
      }

      // Update the active file content
      setActiveFile({
        ...activeFile,
        content: code
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving file:', error);
      // Handle error - maybe show a toast or error message
    } finally {
      if (!skipStateUpdate) setIsSaving(false);
    }
  };

  // Debounced auto-save function
  const debouncedAutoSave = useDebounce(async () => {
    if (activeFile && hasUnsavedChanges && !isSaving) {
      try {
        setIsSaving(true);
        await saveFile(true);
      } finally {
        setIsSaving(false);
      }
    }
  }, 2000); // Auto-save after 2 seconds of inactivity

  // Track changes and trigger auto-save
  useEffect(() => {
    if (activeFile && code !== activeFile.content) {
      setHasUnsavedChanges(true);
      debouncedAutoSave();
    } else {
      setHasUnsavedChanges(false);
    }
  }, [code, activeFile, debouncedAutoSave]);

  // Update code when activeFile content changes
  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.content);
      setHasUnsavedChanges(false);
    }
  }, [activeFile]);

  return (
    <EditorContext.Provider value={{
      code,
      setCode,
      language,
      setLanguage,
      activeFile,
      setActiveFile,
      openFile,
      saveFile,
      isLoading,
      setIsLoading,
      executionResult,
      setExecutionResult,
      isExecuting,
      setIsExecuting,
      isSaving,
      hasUnsavedChanges
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
