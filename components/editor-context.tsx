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
  closeFile: () => void;
  saveFile: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  executionResult: ExecutionResult | null;
  setExecutionResult: (result: ExecutionResult | null) => void;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  promptQualityScore: number;
  setPromptQualityScore: (score: number) => void;
  promptMetrics: any;
  setPromptMetrics: (metrics: any) => void;
  getAllFiles: (sessionId: string) => Promise<{[filename: string]: string}>;
  executeMultiFile: (sessionId: string, entryPoint?: string) => Promise<void>;
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
  const [promptQualityScore, setPromptQualityScore] = useState(8.4);
  const [promptMetrics, setPromptMetrics] = useState(null);

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

  const closeFile = () => {
    setActiveFile(null);
    setCode('');
    setHasUnsavedChanges(false);
  };

  const getAllFiles = async (sessionId: string): Promise<{[filename: string]: string}> => {
    try {
      // Get list of all files in the session
      const { data: fileList, error: listError } = await supabase.storage
        .from('Sessions')
        .list(sessionId, {
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        throw listError;
      }

      const files: {[filename: string]: string} = {};

      // Download content for each file
      for (const file of fileList || []) {
        if (file.metadata) { // Only process actual files, not folders
          try {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('Sessions')
              .download(`${sessionId}/${file.name}`);

            if (!downloadError && fileData) {
              const content = await fileData.text();
              files[file.name] = content;
            }
          } catch (error) {
            console.error(`Error downloading file ${file.name}:`, error);
            // Continue with other files even if one fails
          }
        }
      }

      return files;
    } catch (error) {
      console.error('Error fetching all files:', error);
      throw error;
    }
  };

  const executeMultiFile = async (sessionId: string, entryPoint: string = 'test') => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      // Get all files in the session
      const files = await getAllFiles(sessionId);
      
      if (Object.keys(files).length === 0) {
        setExecutionResult({
          success: false,
          output: '',
          error: 'No files found in the session'
        });
        return;
      }

      // Determine the language based on file extensions
      const fileNames = Object.keys(files);
      let detectedLanguage = 'python'; // default
      
      if (fileNames.some(name => name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx'))) {
        detectedLanguage = 'javascript';
      }

      // Find entry point file
      let actualEntryPoint = entryPoint;
      if (!files[entryPoint]) {
        // Try common entry point names
        const commonEntryPoints = ['test.py','main.py', 'index.js', 'app.py', 'main.js'];
        const foundEntryPoint = commonEntryPoints.find(ep => files[ep]);
        if (foundEntryPoint) {
          actualEntryPoint = foundEntryPoint;
        } else {
          // Use the first file as entry point
          actualEntryPoint = fileNames[0];
        }
      }

      const response = await fetch('/api/execute-multi-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: files,
          language: detectedLanguage,
          entry_point: actualEntryPoint
        }),
      });

      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        output: '',
        error: 'Failed to execute multi-file code: Network error'
      });
    } finally {
      setIsExecuting(false);
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
      closeFile,
      saveFile,
      isLoading,
      setIsLoading,
      executionResult,
      setExecutionResult,
      isExecuting,
      setIsExecuting,
      isSaving,
      hasUnsavedChanges,
      promptQualityScore,
      setPromptQualityScore,
      promptMetrics,
      setPromptMetrics,
      getAllFiles,
      executeMultiFile
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
