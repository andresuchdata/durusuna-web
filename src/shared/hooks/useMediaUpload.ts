"use client";

import { useState, useRef } from "react";
import { http } from "@/core/http/axios";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  url?: string;
  name: string;
  type: string;
  size: number;
  uploadProgress?: number;
  isUploading?: boolean;
  isUploaded?: boolean;
  error?: string;
}

export interface UploadedAttachment {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
}

interface UseMediaUploadOptions {
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  entityId?: string; // classId, conversationId, etc.
  uploadEndpoint?: string; // endpoint to get presigned URLs
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const {
    maxFiles = MAX_FILES,
    maxFileSize = MAX_FILE_SIZE,
    acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    entityId,
    uploadEndpoint = '/class-updates/generate-presigned-urls',
  } = options;

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const videoUrl = URL.createObjectURL(file);
        resolve(videoUrl);
      } else {
        resolve(undefined);
      }
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const newMediaFiles: MediaFile[] = [];
    const newErrors: Record<string, string> = {};

    const totalFiles = mediaFiles.length + uploadedAttachments.length;

    for (const file of selectedFiles) {
      if (totalFiles + newMediaFiles.length >= maxFiles) {
        newErrors.files = `Maximum ${maxFiles} files allowed`;
        break;
      }

      if (file.size > maxFileSize) {
        newErrors.files = `File "${file.name}" exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`;
        continue;
      }

      const id = generateId();
      const preview = await createPreview(file);

      newMediaFiles.push({
        id,
        file,
        preview,
        name: file.name,
        type: file.type,
        size: file.size,
        isUploading: false,
        isUploaded: false,
      });
    }

    if (newMediaFiles.length > 0) {
      setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    }

    setErrors(newErrors);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview && file.type.startsWith('video/')) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const removeUploadedAttachment = (id: string) => {
    setUploadedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const uploadFiles = async (): Promise<UploadedAttachment[]> => {
    if (!entityId) {
      setErrors({ upload: 'Entity ID is required for upload' });
      throw new Error('Entity ID is required');
    }

    if (mediaFiles.length === 0) {
      return [];
    }

    setIsUploading(true);
    setErrors({});

    try {
      // Step 1: Get presigned URLs
      const filesInfo = mediaFiles.map((mf) => ({
        name: mf.file.name,
        type: mf.file.type,
        size: mf.file.size,
      }));

      const { data: urlsData } = await http().post(uploadEndpoint, {
        class_id: entityId, // For backward compatibility
        conversation_id: entityId, // For chat
        entity_id: entityId,
        files: filesInfo,
      });

      // Step 2: Upload files to storage
      const uploadPromises = urlsData.urls.map(async (urlInfo: {
        id: string;
        uploadUrl: string;
        publicUrl: string;
        key: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
      }, index: number) => {
        const mediaFile = mediaFiles[index];
        
        // Update progress
        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id ? { ...f, isUploading: true, uploadProgress: 0 } : f
          )
        );

        const uploadResponse = await fetch(urlInfo.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mediaFile.file.type,
          },
          body: mediaFile.file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${mediaFile.file.name}`);
        }

        // Update as uploaded
        setMediaFiles((prev) =>
          prev.map((f) =>
            f.id === mediaFile.id
              ? { ...f, isUploading: false, isUploaded: true, uploadProgress: 100, url: urlInfo.publicUrl }
              : f
          )
        );

        return {
          id: urlInfo.id,
          originalName: urlInfo.originalName,
          fileName: urlInfo.fileName,
          mimeType: urlInfo.mimeType,
          size: urlInfo.size,
          url: urlInfo.publicUrl,
          key: urlInfo.key,
        };
      });

      const attachments = await Promise.all(uploadPromises);
      setUploadedAttachments((prev) => [...prev, ...attachments]);
      setMediaFiles([]); // Clear media files after successful upload

      return attachments;
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const err = error as { message?: string };
      setErrors({ upload: err?.message || 'Failed to upload files' });
      
      // Reset uploading state
      setMediaFiles((prev) =>
        prev.map((f) => ({ ...f, isUploading: false, error: 'Upload failed' }))
      );
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    // Revoke object URLs
    mediaFiles.forEach((file) => {
      if (file.preview && file.type.startsWith('video/')) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    setMediaFiles([]);
    setUploadedAttachments([]);
    setErrors({});
  };

  const reset = () => {
    clearAll();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canAddMore = mediaFiles.length + uploadedAttachments.length < maxFiles;

  return {
    mediaFiles,
    uploadedAttachments,
    isUploading,
    errors,
    fileInputRef,
    canAddMore,
    totalCount: mediaFiles.length + uploadedAttachments.length,
    handleFileSelect,
    removeMediaFile,
    removeUploadedAttachment,
    uploadFiles,
    clearAll,
    reset,
    acceptedTypes: acceptedTypes.join(','),
    maxFiles,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

