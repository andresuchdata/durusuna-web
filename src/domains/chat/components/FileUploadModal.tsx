"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Image as ImageIcon, Video, Music, File, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  conversationId: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
  audio: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
};

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  for (const [type, mimeTypes] of Object.entries(ACCEPTED_TYPES)) {
    if (mimeTypes.includes(mimeType)) {
      return type as 'image' | 'video' | 'audio' | 'document' | 'other';
    }
  }
  return 'other';
}

function getFileIcon(type: string) {
  switch (type) {
    case 'image': return <ImageIcon className="h-8 w-8 text-blue-500" />;
    case 'video': return <Video className="h-8 w-8 text-red-500" />;
    case 'audio': return <Music className="h-8 w-8 text-green-500" />;
    case 'document': return <FileText className="h-8 w-8 text-purple-500" />;
    default: return <File className="h-8 w-8 text-gray-500" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileUploadModal({ open, onClose, onUpload, conversationId }: FileUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | File[]) => {
    const newFiles: FileWithPreview[] = [];
    
    Array.from(fileList).forEach((file) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 100MB.`);
        return;
      }

      // Check if we're exceeding max files
      if (files.length + newFiles.length >= MAX_FILES) {
        alert(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }

      const fileType = getFileType(file.type);
      const fileWithPreview: FileWithPreview = {
        file,
        type: fileType,
        progress: 0,
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileWithPreview.preview = e.target?.result as string;
          setFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(fileWithPreview);
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const fileObjects = files.map(f => f.file);
      await onUpload(fileObjects);
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      // Handle error - you might want to show an error message
    } finally {
      setIsUploading(false);
    }
  };

  const selectFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Drag and drop files here, or{' '}
              <button
                type="button"
                onClick={selectFiles}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images, videos, audio, documents • Max 100MB each • {MAX_FILES} files max
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              accept={Object.values(ACCEPTED_TYPES).flat().join(',')}
            />
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                {files.map((fileWithPreview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {fileWithPreview.preview ? (
                        <img 
                          src={fileWithPreview.preview} 
                          alt=""
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center">
                          {getFileIcon(fileWithPreview.type)}
                        </div>
                      )}
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {fileWithPreview.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileWithPreview.file.size)}
                        </p>
                        
                        {isUploading && (
                          <div className="mt-1">
                            <Progress value={fileWithPreview.progress} className="h-2" />
                          </div>
                        )}
                        
                        {fileWithPreview.error && (
                          <div className="mt-1 flex items-center text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span className="text-xs">{fileWithPreview.error}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="ml-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || isUploading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
