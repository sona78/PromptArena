"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Check } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface FileUploadProps {
  onFileSelect?: (file: File | null, content: string) => void;
  onFolderSelect?: (files: File[], fileStructure: Record<string, string>) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  placeholder?: string;
  currentFileName?: string;
  className?: string;
  allowFolders?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFolderSelect,
  accept = {
    'text/*': ['.txt', '.py', '.js', '.ts', '.json', '.md', '.yml', '.yaml'],
    'application/json': ['.json']
  },
  maxSize = 1024 * 1024, // 1MB
  placeholder = "Drag and drop a file here, or click to browse",
  currentFileName,
  className = "",
  allowFolders = false
}: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');
    setIsLoading(true);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a text file.');
      } else {
        setError('File upload failed. Please try again.');
      }
      setIsLoading(false);
      return;
    }

    if (acceptedFiles.length > 0) {
      try {
        if (allowFolders && acceptedFiles.length > 1) {
          // Handle multiple files (folder upload)
          const fileStructure: Record<string, string> = {};
          
          for (const file of acceptedFiles) {
            try {
              const content = await file.text();
              // Use the webkitRelativePath or name for the file path
              const filePath = (file as any).webkitRelativePath || file.name;
              fileStructure[filePath] = content;
            } catch (err) {
              console.warn(`Failed to read file: ${file.name}`, err);
            }
          }
          
          setUploadedFiles(acceptedFiles);
          setUploadedFile(null);
          onFolderSelect?.(acceptedFiles, fileStructure);
        } else {
          // Handle single file
          const file = acceptedFiles[0];
          const content = await file.text();
          setUploadedFile(file);
          setUploadedFiles([]);
          onFileSelect?.(file, content);
        }
      } catch (err) {
        setError('Failed to read file content. Please try again.');
        onFileSelect?.(null, '');
      }
    }
    
    setIsLoading(false);
  }, [onFileSelect, onFolderSelect, maxSize, allowFolders]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: allowFolders
  });

  const removeFile = () => {
    setUploadedFile(null);
    setUploadedFiles([]);
    setError('');
    onFileSelect?.(null, '');
    onFolderSelect?.([], {});
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!uploadedFile && !currentFileName && uploadedFiles.length === 0 && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-3 rounded-full ${
              isDragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${
                isDragActive ? 'text-blue-600' : 'text-gray-500'
              }`} />
            </div>
            
            <div className="space-y-2">
              <p className={`text-lg font-medium ${
                isDragActive ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {isDragActive ? 'Drop the file here' : placeholder}
              </p>
              <p className="text-sm text-gray-500">
                {allowFolders 
                  ? "Supports: folders with .py, .js, .ts, .txt, .json, .md, .yml files"
                  : `Supports: .py, .js, .ts, .txt, .json, .md, .yml (max ${Math.round(maxSize / 1024 / 1024)}MB)`
                }
              </p>
            </div>

            {isLoading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Reading file...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show uploaded file */}
      {uploadedFile && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <File className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Uploaded
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Show uploaded folder */}
      {uploadedFiles.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <File className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Challenge Folder</p>
                <p className="text-sm text-gray-500">{uploadedFiles.length} files uploaded</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Uploaded
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Show file list */}
          <div className="max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-500 space-y-1">
              {uploadedFiles.slice(0, 10).map((file, index) => (
                <div key={index} className="flex justify-between">
                  <span>{(file as any).webkitRelativePath || file.name}</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              ))}
              {uploadedFiles.length > 10 && (
                <div className="text-gray-400 italic">
                  ... and {uploadedFiles.length - 10} more files
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show current file name if provided */}
      {currentFileName && !uploadedFile && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <File className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{currentFileName}</p>
                <p className="text-sm text-gray-500">Current test file</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Trigger file picker
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = Object.values(accept).flat().join(',');
                if (allowFolders) {
                  (input as any).webkitdirectory = true;
                  input.multiple = true;
                }
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    onDrop(Array.from(files), []);
                  }
                };
                input.click();
              }}
            >
              Replace
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
