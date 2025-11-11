"use client";

import { useState, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}

export interface UploadProgressProps {
  files: UploadFile[];
  onFilesChange: (files: UploadFile[]) => void;
  onRemoveFile?: (fileId: string) => void;
  showPreviews?: boolean;
  compact?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('document') || type.includes('text/')) return '📝';
  if (type.includes('spreadsheet')) return '📊';
  return '📎';
}

function getStatusIcon(status: UploadFile['status']) {
  switch (status) {
    case 'pending':
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    case 'uploading':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
}

export function UploadProgress({ 
  files, 
  onFilesChange, 
  onRemoveFile,
  showPreviews = true,
  compact = false 
}: UploadProgressProps) {
  const updateFileProgress = useCallback((fileId: string, progress: number, status?: UploadFile['status']) => {
    onFilesChange(files.map(file => 
      file.id === fileId 
        ? { ...file, progress, ...(status && { status }) }
        : file
    ));
  }, [files, onFilesChange]);

  const updateFileStatus = useCallback((fileId: string, status: UploadFile['status'], error?: string) => {
    onFilesChange(files.map(file => 
      file.id === fileId 
        ? { ...file, status, ...(error && { error }) }
        : file
    ));
  }, [files, onFilesChange]);

  const handleRemoveFile = (fileId: string) => {
    if (onRemoveFile) {
      onRemoveFile(fileId);
    } else {
      onFilesChange(files.filter(file => file.id !== fileId));
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              flex items-center gap-3 p-3 border rounded-lg transition-colors
              ${file.status === 'error' ? 'border-red-200 bg-red-50' : 
                file.status === 'completed' ? 'border-green-200 bg-green-50' :
                file.status === 'uploading' ? 'border-blue-200 bg-blue-50' :
                'border-gray-200 bg-gray-50'}
              ${compact ? 'p-2' : 'p-3'}
            `}
          >
            {/* File Icon/Preview */}
            <div className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-12 h-12'}`}>
              {showPreviews && file.preview && file.file.type.startsWith('image/') ? (
                <img 
                  src={file.preview} 
                  alt=""
                  className={`object-cover rounded ${compact ? 'w-8 h-8' : 'w-12 h-12'}`}
                />
              ) : (
                <div className={`
                  flex items-center justify-center rounded bg-gray-100
                  ${compact ? 'w-8 h-8 text-lg' : 'w-12 h-12 text-2xl'}
                `}>
                  {getFileIcon(file.file)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'}`}>
                  {file.name}
                </p>
                {getStatusIcon(file.status)}
              </div>
              
              <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                {formatFileSize(file.size)}
                {file.status === 'uploading' && ` • ${Math.round(file.progress)}%`}
                {file.status === 'completed' && ' • Uploaded'}
                {file.status === 'error' && file.error && ` • ${file.error}`}
              </p>

              {/* Progress Bar */}
              {file.status === 'uploading' && (
                <div className="mt-2">
                  <Progress 
                    value={file.progress} 
                    className={compact ? "h-1" : "h-2"} 
                  />
                </div>
              )}

              {/* Error Message */}
              {file.status === 'error' && file.error && (
                <div className="mt-1 text-xs text-red-600">
                  {file.error}
                </div>
              )}
            </div>

            {/* Remove Button */}
            {file.status !== 'uploading' && (
              <button
                onClick={() => handleRemoveFile(file.id)}
                className={`
                  flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors
                  ${compact ? 'text-sm' : 'text-base'}
                `}
                aria-label="Remove file"
              >
                ✕
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing upload files with progress
export function useUploadProgress() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const progressCallbacks = useRef<Map<string, (progress: number) => void>>(new Map());

  const addFiles = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending' as const,
    }));

    // Create image previews for image files
    uploadFiles.forEach(uploadFile => {
      if (uploadFile.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, preview: e.target?.result as string }
              : f
          ));
        };
        reader.readAsDataURL(uploadFile.file);
      }
    });

    setFiles(prev => [...prev, ...uploadFiles]);
    return uploadFiles;
  }, []);

  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, progress, status: progress >= 100 ? 'completed' : 'uploading' }
        : file
    ));
  }, []);

  const updateFileStatus = useCallback((fileId: string, status: UploadFile['status'], error?: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status, ...(error && { error }) }
        : file
    ));
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    progressCallbacks.current.delete(fileId);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    progressCallbacks.current.clear();
  }, []);

  const getProgressCallback = useCallback((fileId: string) => {
    if (!progressCallbacks.current.has(fileId)) {
      progressCallbacks.current.set(fileId, (progress: number) => {
        updateFileProgress(fileId, progress);
      });
    }
    return progressCallbacks.current.get(fileId)!;
  }, [updateFileProgress]);

  return {
    files,
    setFiles,
    addFiles,
    updateFileProgress,
    updateFileStatus,
    removeFile,
    clearFiles,
    getProgressCallback,
  };
}
