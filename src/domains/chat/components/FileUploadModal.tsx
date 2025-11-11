"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { UploadProgress, useUploadProgress } from "@/components/ui/upload-progress";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  conversationId: string;
  onOptimisticMessage?: (files: File[], text?: string) => void;
  fileType?: 'image' | 'video' | 'audio' | 'document' | 'media' | null;
}

// Removed FileWithPreview interface - now using UploadFile from upload-progress component

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;

const ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
  video: ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/mkv', 'video/3gp'],
  audio: [
    'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 
    'audio/aac', 'audio/flac', 'audio/wma', 'audio/opus', 'audio/webm'
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain',
    'text/csv',
    'application/rtf',
    'application/vnd.oasis.opendocument.text', // .odt
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'application/vnd.oasis.opendocument.presentation', // .odp
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
    'text/xml',
    'application/xml'
  ],
  media: [] // Will be populated dynamically
};

// Helper function to get allowed file types based on filter
const getAllowedTypes = (fileType: 'image' | 'video' | 'audio' | 'document' | 'media' | null | undefined): string[] => {
  if (!fileType) {
    return Object.values(ACCEPTED_TYPES).flat();
  }
  
  if (fileType === 'media') {
    return [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.video];
  }
  
  return ACCEPTED_TYPES[fileType] || [];
};

// Helper function to get file type description
const getFileTypeDescription = (fileType: 'image' | 'video' | 'audio' | 'document' | 'media' | null | undefined): string => {
  switch (fileType) {
    case 'image':
      return 'Images only';
    case 'video':
      return 'Videos only';
    case 'audio':
      return 'Audio files only';
    case 'document':
      return 'Documents (PDF, DOCX, XLSX, PPTX, TXT, CSV, etc.)';
    case 'media':
      return 'Images and videos';
    default:
      return 'Images, videos, audio, documents';
  }
};

// Removed getFileType function - no longer needed

export function FileUploadModal({ open, onClose, onUpload, fileType }: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    files,
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
  } = useUploadProgress();

  const handleFiles = (fileList: FileList | File[]) => {
    const validFiles: File[] = [];
    const allowedTypes = getAllowedTypes(fileType);
    
    Array.from(fileList).forEach((file) => {
      // Debug logging for document types
      if (fileType === 'document') {
        console.log('Document file validation:', {
          fileName: file.name,
          fileType: file.type,
          allowedTypes,
          isAllowed: allowedTypes.includes(file.type)
        });
      }
      
      // Validate file type if filter is applied
      if (fileType && !allowedTypes.includes(file.type)) {
        console.error('File type validation failed:', {
          fileName: file.name,
          fileType: file.type,
          filterType: fileType,
          allowedTypes
        });
        
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `File "${file.name}" (${file.type}) is not allowed. ${getFileTypeDescription(fileType)} only.`,
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `File "${file.name}" is too large. Maximum size is 100MB.`,
        });
        return;
      }

      // Check if we're exceeding max files
      if (files.length + validFiles.length >= MAX_FILES) {
        toast({
          variant: "destructive",
          title: "Too many files",
          description: `Maximum ${MAX_FILES} files allowed.`,
        });
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      addFiles(validFiles);
    }
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

  // removeFile function is now provided by useUploadProgress hook

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    try {
      const fileObjects = files.map(f => f.file);
      
      // DON'T create optimistic message here - let the upload handler do it
      // This prevents duplicate optimistic messages from appearing
      // The handleFileUpload function will create the optimistic message with proper progress tracking
      
      // Close modal immediately for better UX
      clearFiles();
      onClose();
      
      // Call the onUpload callback which handles the actual upload AND optimistic message creation
      await onUpload(fileObjects);
      
    } catch (error: unknown) {
      console.error('Upload failed:', error);
      
      // Error handling is now done in the parent component (handleFileUpload)
      // since that's where the actual upload happens
    }
  };

  const selectFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {fileType === 'audio' ? 'Upload Audio Files' :
             fileType === 'document' ? 'Upload Documents' :
             fileType === 'media' ? 'Upload Images/Videos' :
             fileType === 'image' ? 'Upload Images' :
             fileType === 'video' ? 'Upload Videos' :
             'Upload Files'}
          </DialogTitle>
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
              {getFileTypeDescription(fileType)} • Max 100MB each • {MAX_FILES} files max
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              accept={getAllowedTypes(fileType).join(',')}
            />
          </div>

          {/* File List with Progress */}
          {files.length > 0 && (
            <div className="mt-4">
              <UploadProgress
                files={files}
                onFilesChange={setFiles}
                onRemoveFile={removeFile}
                showPreviews={true}
                compact={false}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={files.some(f => f.status === 'uploading')}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || files.some(f => f.status === 'uploading')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {files.some(f => f.status === 'uploading') 
              ? 'Uploading...' 
              : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
