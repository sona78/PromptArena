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
      const fileTree = buildFileTree((data || []) as any[]);

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

  const buildFileTree = (items: Array<any>): FileItem[] => {
    const tree: FileItem[] = [];

    items.forEach(item => {
      const fileItem: FileItem = {
        name: item.name as string,
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
            folder.children = buildFileTree(data as any[]);
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

      // Force refresh the file list before opening to ensure we have the latest file data
      if (activeFile?.name !== item.name) {
        await fetchFiles();
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
          className={`flex items-center py-1 px-2 hover:bg-[#C5AECF]/20 cursor-pointer text-sm group ${
            isActive ? 'bg-[#3073B7]/10 border-r-2 border-[#3073B7]' : ''
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
                  <ChevronDown className="w-4 h-4 mr-1 text-[#79797C]" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1 text-[#79797C]" />
                )}
                <Folder className="w-4 h-4 mr-2 text-[#00656B]" />
              </>
            ) : (
              <>
                <div className="w-4 h-4 mr-1" />
                {isTestFile ? (
                  <Lock className="w-4 h-4 mr-2 text-[#953640]" />
                ) : (
                  <File className="w-4 h-4 mr-2 text-[#79797C]" />
                )}
              </>
            )}
            <span className={`truncate ${isActive ? 'text-[#3073B7] font-medium' : 'text-[#28282D]'} ${isTestFile ? 'opacity-75' : ''}`}>
              {item.name}
              {isTestFile && <span className="text-xs text-[#953640] ml-1">(test - locked)</span>}
            </span>
          </div>

          {item.type === 'file' && !isLocked && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-[#79797C] hover:text-[#28282D]"
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
                    className="text-[#953640] focus:text-[#953640]/80"
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
      <div className="w-64 bg-white border-r border-[#79797C] p-4">
        <div className="text-[#79797C] text-sm">No session selected</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-[#79797C] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#79797C]">
        <h3 className="font-semibold text-[#28282D] text-sm">Files</h3>
        <p className="text-xs text-[#79797C] mt-1 truncate" title={sessionId}>
          {sessionId}
        </p>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-[#3073B7]" />
            <span className="ml-2 text-sm text-[#79797C]">Loading...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-[#953640]">{error}</div>
        ) : files.length === 0 ? (
          <div className="p-4 text-sm text-[#79797C]">No files found</div>
        ) : (
          <div className="py-2">
            {files.map((file, index) => renderFileItem(file, index))}

            {/* File creation input */}
            {creatingFile && (
              <div className="px-2 py-1">
                <form onSubmit={handleCreateFileSubmit} className="flex items-center space-x-1">
                  <div className="w-4 h-4 mr-1" />
                  <File className="w-4 h-4 mr-2 text-[#79797C]" />
                  <Input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename.py"
                    className="h-6 text-xs bg-white border-[#79797C] text-[#28282D] flex-1"
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
      <div className="p-2 border-t border-[#79797C] space-y-2">
        {/* Evaluation Scores */}
        {(codeEvaluationScore !== null || promptChainingScore !== null || codeAccuracyScore !== null) && (
          <div className="space-y-2">
            {codeEvaluationScore !== null && (
              <div className="bg-[#C5AECF]/10 border border-[#C5AECF] rounded-md p-2 text-center">
                <div className="text-xs text-[#79797C] mb-1">Code Quality Score</div>
                <div className="text-lg font-bold text-[#3073B7]">
                  {(codeEvaluationScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {promptChainingScore !== null && (
              <div className="bg-[#C5AECF]/10 border border-[#C5AECF] rounded-md p-2 text-center">
                <div className="text-xs text-[#79797C] mb-1">Prompt Chaining Score</div>
                <div className="text-lg font-bold text-[#00656B]">
                  {(promptChainingScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {codeAccuracyScore !== null && (
              <div className="bg-[#C5AECF]/10 border border-[#C5AECF] rounded-md p-2 text-center">
                <div className="text-xs text-[#79797C] mb-1">Code Accuracy Score</div>
                <div className="text-lg font-bold text-[#46295A]">
                  {(codeAccuracyScore * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}
        
        <Button
          onClick={handleCreateFile}
          className="w-full text-xs bg-[#3073B7] hover:bg-[#3073B7]/80 text-white"
          size="sm"
          disabled={loading || creatingFile}
        >
          <Plus className="w-3 h-3 mr-1" />
          New File
        </Button>
        <Button
          onClick={fetchFiles}
          variant="outline"
          className="w-full text-xs bg-[#C5AECF]/10 hover:bg-[#C5AECF]/20 text-[#28282D] border-[#79797C]"
          size="sm"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}