"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, File, ChevronRight, ChevronDown, Loader2, Plus, Trash2, MoreHorizontal, Lock } from 'lucide-react';
import { useEditor } from './editor-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  isExpanded?: boolean;
}

interface FileSystemSidebarProps {
  sessionId: string;
}

export function FileSystemSidebar({ sessionId }: FileSystemSidebarProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [testFile, setTestFile] = useState<string>('');
  const { openFile, activeFile, closeFile, codeEvaluationScore, promptChainingScore, codeAccuracyScore } = useEditor();

  useEffect(() => {
    if (sessionId) {
      fetchFiles();
      fetchTaskFiles();
    }
  }, [sessionId]); // fetchFiles and fetchTaskFiles are defined inside the component and will cause infinite re-renders if added

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: storageError } = await supabase.storage
        .from('Sessions')
        .list(sessionId, {
          sortBy: { column: 'name', order: 'asc' }
        });

      if (storageError) {
        throw storageError;
      }

      // Build file tree structure
      const fileTree = buildFileTree(data || []);

      // Only add test file to the file tree if it exists in storage and is not already in the list
      if (testFile && !fileTree.some(f => f.name === testFile)) {
        // Check if test file actually exists in storage
        const { data: testFileData, error: testFileError } = await supabase.storage
          .from('Sessions')
          .list(sessionId, {
            search: testFile
          });

        // Only add if the test file exists in storage
        if (!testFileError && testFileData && testFileData.some(file => file.name === testFile)) {
          fileTree.push({
            name: testFile,
            path: `${sessionId}/${testFile}`,
            type: 'file',
            isExpanded: false
          });
        }
      }

      setFiles(fileTree);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // Refresh files when test file changes
  useEffect(() => {
    if (testFile && sessionId) {
      fetchFiles();
    }
  }, [testFile, sessionId]); // fetchFiles would cause infinite re-renders if added

  const buildFileTree = (items: Array<Record<string, unknown>>): FileItem[] => {
    const tree: FileItem[] = [];

    items.forEach(item => {
      const fileItem: FileItem = {
        name: item.name,
        path: `${sessionId}/${item.name}`,
        type: item.metadata ? 'file' : 'folder',
        isExpanded: false
      };

      tree.push(fileItem);
    });

    return tree;
  };

  const toggleFolder = async (index: number) => {
    const newFiles = [...files];
    const folder = newFiles[index];

    if (folder.type === 'folder') {
      folder.isExpanded = !folder.isExpanded;

      if (folder.isExpanded && !folder.children) {
        // Fetch folder contents
        try {
          const { data, error } = await supabase.storage
            .from('Sessions')
            .list(folder.path, {
              sortBy: { column: 'name', order: 'asc' }
            });

          if (!error && data) {
            folder.children = buildFileTree(data);
          }
        } catch (err) {
          console.error('Error fetching folder contents:', err);
        }
      }

      setFiles(newFiles);
    }
  };

  const fetchTaskFiles = async () => {
    try {
      // First get the task_id from the session
      const { data: session, error: sessionError } = await supabase
        .from('Sessions')
        .select('task_id')
        .eq('session_id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      // Then get the test_file from the task
      const { data: task, error: taskError } = await supabase
        .from('Tasks')
        .select('test_file')
        .eq('task_id', session.task_id)
        .single();

      if (taskError) {
        console.error('Error fetching task:', taskError);
        return;
      }

      if (task?.test_file) {
        setTestFile(task.test_file);
      }
    } catch (error) {
      console.error('Error fetching task files:', error);
    }
  };

  const handleFileClick = async (item: FileItem) => {
    if (item.type === 'file') {
      // Prevent opening the test file
      if (item.name === testFile) {
        setError('Test file is locked and cannot be edited');
        setTimeout(() => setError(null), 750); // Clear error after 3 seconds
        return;
      }
      await openFile(item.path, item.name);
    }
  };

  const createFile = async (fileName: string) => {
    if (!fileName.trim()) return;

    try {
      const filePath = `${sessionId}/${fileName.trim()}`;
      const { error } = await supabase.storage
        .from('Sessions')
        .upload(filePath, new Blob([''], { type: 'text/plain' }));

      if (error) {
        throw error;
      }

      // Refresh file list
      await fetchFiles();
      setCreatingFile(false);
      setNewFileName('');

      // Automatically open the new file
      await openFile(filePath, fileName.trim());
    } catch (error) {
      console.error('Error creating file:', error);
      setError('Failed to create file');
    }
  };

  const deleteFile = async (fileName: string) => {
    if (fileName === testFile) {
      setError('Cannot delete test file');
      return;
    }

    try {
      const filePath = `${sessionId}/${fileName}`;
      const { error } = await supabase.storage
        .from('Sessions')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      // Close file if it's currently active
      if (activeFile && activeFile.name === fileName) {
        closeFile();
      }

      // Refresh file list
      await fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const handleCreateFile = () => {
    setCreatingFile(true);
    setNewFileName('');
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFile(newFileName);
  };

  const handleCreateFileCancel = () => {
    setCreatingFile(false);
    setNewFileName('');
  };

  const renderFileItem = (item: FileItem, index: number, level = 0) => {
    const paddingLeft = level * 16 + 8;
    const isActive = activeFile?.path === item.path;
    const isTestFile = item.name === testFile;
    const isLocked = isTestFile;

    return (
      <div key={`${item.path}-${index}`}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer text-sm group ${
            isActive ? 'bg-blue-900/50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div
            className="flex items-center flex-1 min-w-0"
            onClick={() => item.type === 'folder' ? toggleFolder(index) : handleFileClick(item)}
          >
            {item.type === 'folder' ? (
              <>
                {item.isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-1 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1 text-gray-400" />
                )}
                <Folder className="w-4 h-4 mr-2 text-blue-400" />
              </>
            ) : (
              <>
                <div className="w-4 h-4 mr-1" />
                {isTestFile ? (
                  <Lock className="w-4 h-4 mr-2 text-red-400" />
                ) : (
                  <File className="w-4 h-4 mr-2 text-gray-400" />
                )}
              </>
            )}
            <span className={`truncate ${isActive ? 'text-blue-200 font-medium' : 'text-gray-200'} ${isTestFile ? 'opacity-75' : ''}`}>
              {item.name}
              {isTestFile && <span className="text-xs text-red-400 ml-1">(test - locked)</span>}
            </span>
          </div>

          {item.type === 'file' && !isLocked && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(item.name);
                    }}
                    className="text-red-400 focus:text-red-300"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {item.type === 'folder' && item.isExpanded && item.children && (
          <div>
            {item.children.map((child, childIndex) =>
              renderFileItem(child, childIndex, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (!sessionId) {
    return (
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
        <div className="text-gray-400 text-sm">No session selected</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-semibold text-gray-200 text-sm">Files</h3>
        <p className="text-xs text-gray-500 mt-1 truncate" title={sessionId}>
          {sessionId}
        </p>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No files found</div>
        ) : (
          <div className="py-2">
            {files.map((file, index) => renderFileItem(file, index))}

            {/* File creation input */}
            {creatingFile && (
              <div className="px-2 py-1">
                <form onSubmit={handleCreateFileSubmit} className="flex items-center space-x-1">
                  <div className="w-4 h-4 mr-1" />
                  <File className="w-4 h-4 mr-2 text-gray-400" />
                  <Input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename.py"
                    className="h-6 text-xs bg-gray-800 border-gray-700 text-gray-200 flex-1"
                    autoFocus
                    onBlur={handleCreateFileCancel}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleCreateFileCancel();
                      }
                    }}
                  />
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-gray-800 space-y-2">
        {/* Evaluation Scores */}
        {(codeEvaluationScore !== null || promptChainingScore !== null || codeAccuracyScore !== null) && (
          <div className="space-y-2">
            {codeEvaluationScore !== null && (
              <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">Code Quality Score</div>
                <div className="text-lg font-bold text-blue-400">
                  {(codeEvaluationScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {promptChainingScore !== null && (
              <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">Prompt Chaining Score</div>
                <div className="text-lg font-bold text-green-400">
                  {(promptChainingScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {codeAccuracyScore !== null && (
              <div className="bg-gray-800 border border-gray-700 rounded-md p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">Code Accuracy Score</div>
                <div className="text-lg font-bold text-purple-400">
                  {(codeAccuracyScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}
        
        <Button
          onClick={handleCreateFile}
          className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
          disabled={loading || creatingFile}
        >
          <Plus className="w-3 h-3 mr-1" />
          New File
        </Button>
        <Button
          onClick={fetchFiles}
          variant="outline"
          className="w-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
          size="sm"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}