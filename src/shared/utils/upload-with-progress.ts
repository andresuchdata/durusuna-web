"use client";

import { http } from "@/core/http/axios";

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface FileUploadOptions {
  onProgress?: UploadProgressCallback;
  signal?: AbortSignal;
}

export interface UploadResult {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: string;
}

/**
 * Upload chat media files with progress tracking
 */
export async function uploadChatMediaWithProgress(
  conversationId: string,
  files: File[],
  options: {
    onProgress?: (fileIndex: number, progress: number) => void;
    onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{
  success: boolean;
  files: UploadResult[];
}> {
  const { onProgress, onFileComplete, signal } = options;

  // For chat uploads, we use FormData with multipart upload
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await http().post(
    `/conversations/${conversationId}/upload-media`, 
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // For multipart upload, we can't track individual files, so we report overall progress
          files.forEach((_, index) => {
            onProgress(index, progress);
          });
        }
      },
    }
  );

  // Notify completion for each file
  if (onFileComplete && data.files) {
    data.files.forEach((file: UploadResult, index: number) => {
      onFileComplete(index, file);
    });
  }

  return data;
}

/**
 * Upload class update attachments with progress tracking using presigned URLs
 */
export async function uploadAttachmentsWithProgress(
  classId: string,
  files: File[],
  options: {
    onProgress?: (fileIndex: number, progress: number) => void;
    onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    signal?: AbortSignal;
  } = {}
): Promise<UploadResult[]> {
  const { onProgress, onFileComplete, signal } = options;

  // Step 1: Get presigned URLs from backend
  const filesInfo = files.map(f => ({
    name: f.name,
    type: f.type,
    size: f.size
  }));
  
  const { data: urlsData } = await http().post('/class-updates/generate-presigned-urls', {
    class_id: classId,
    files: filesInfo,
  });
  
  // Step 2: Upload each file directly to storage with progress tracking
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
    const file = files[index];
    
    // Initialize progress
    if (onProgress) {
      onProgress(index, 0);
    }

    // Create XMLHttpRequest for progress tracking (fetch doesn't support progress)
    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload aborted'));
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          onProgress(index, progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result: UploadResult = {
            id: urlInfo.id,
            url: urlInfo.publicUrl,
            fileName: urlInfo.fileName,
            originalName: urlInfo.originalName,
            mimeType: urlInfo.mimeType,
            size: urlInfo.size,
            type: urlInfo.mimeType,
          };

          if (onFileComplete) {
            onFileComplete(index, result);
          }

          resolve(result);
        } else {
          reject(new Error(`Failed to upload ${file.name}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Failed to upload ${file.name}: Network error`));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error(`Upload of ${file.name} was aborted`));
      });

      xhr.open('PUT', urlInfo.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  });
  
  const attachments = await Promise.all(uploadPromises);
  return attachments;
}

/**
 * Upload conversation media files with progress tracking using presigned URLs (FAST METHOD)
 */
export async function uploadConversationMediaWithProgress(
  conversationId: string,
  files: File[],
  options: {
    onProgress?: (fileIndex: number, progress: number) => void;
    onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{
  success: boolean;
  files: UploadResult[];
}> {
  const { onProgress, onFileComplete, signal } = options;

  // Step 1: Get presigned URLs from backend
  const filesInfo = files.map(f => ({
    name: f.name,
    type: f.type,
    size: f.size
  }));
  
  const { data: urlsData } = await http().post('/conversations/generate-presigned-urls', {
    conversation_id: conversationId,
    files: filesInfo,
  });
  
  console.log(`Got ${urlsData.urls.length} presigned URLs for conversation media`);

  // Step 2: Upload each file directly to S3/R2 using presigned URLs
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
    const file = files[index];
    
    // Initialize progress
    if (onProgress) {
      onProgress(index, 0);
    }

    // Create XMLHttpRequest for progress tracking (fetch doesn't support progress)
    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload aborted'));
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          onProgress(index, progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result: UploadResult = {
            id: urlInfo.id,
            url: urlInfo.publicUrl,
            fileName: urlInfo.fileName,
            originalName: urlInfo.originalName,
            mimeType: urlInfo.mimeType,
            size: urlInfo.size,
            type: urlInfo.mimeType,
          };

          if (onFileComplete) {
            onFileComplete(index, result);
          }

          resolve(result);
        } else {
          reject(new Error(`Failed to upload ${file.name}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Failed to upload ${file.name}: Network error`));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error(`Upload of ${file.name} was aborted`));
      });

      xhr.open('PUT', urlInfo.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  });
  
  const uploadResults = await Promise.all(uploadPromises);
  
  return {
    success: true,
    files: uploadResults
  };
}

/**
 * Generic file upload with progress tracking
 */
export async function uploadFileWithProgress(
  file: File,
  uploadUrl: string,
  options: FileUploadOptions = {}
): Promise<void> {
  const { onProgress, signal } = options;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload aborted'));
      });
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded * 100) / event.total);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Utility to create an AbortController for cancelling uploads
 */
export function createUploadController() {
  return new AbortController();
}

/**
 * Utility to format upload speed
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Utility to estimate remaining time
 */
export function estimateRemainingTime(
  uploadedBytes: number, 
  totalBytes: number, 
  bytesPerSecond: number
): string {
  if (bytesPerSecond === 0) return 'Calculating...';
  
  const remainingBytes = totalBytes - uploadedBytes;
  const remainingSeconds = remainingBytes / bytesPerSecond;
  
  if (remainingSeconds < 60) {
    return `${Math.round(remainingSeconds)}s`;
  } else if (remainingSeconds < 3600) {
    return `${Math.round(remainingSeconds / 60)}m`;
  } else {
    return `${Math.round(remainingSeconds / 3600)}h`;
  }
}
