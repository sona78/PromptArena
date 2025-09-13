"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, File, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (sessionId) {
      fetchFiles();
    }
  }, [sessionId]);

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
      setFiles(fileTree);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (items: any[]): FileItem[] => {
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

  const renderFileItem = (item: FileItem, index: number, level = 0) => {
    const paddingLeft = level * 16 + 8;

    return (
      <div key={`${item.path}-${index}`}>
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer text-sm"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => item.type === 'folder' ? toggleFolder(index) : undefined}
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
              <File className="w-4 h-4 mr-2 text-gray-400" />
            </>
          )}
          <span className="text-gray-200 truncate">{item.name}</span>
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
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-gray-800">
        <button
          onClick={fetchFiles}
          className="w-full px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}