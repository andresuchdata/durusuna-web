import type { AttachmentInput } from './api';

export interface FormattedAttachment extends AttachmentInput {
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isDocument: boolean;
  sizeFormatted: string;
  uploadedBy: string;
  uploadedAt: string;
}

/**
 * Determines file type category based on MIME type
 */
export function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // Common document types
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf'
  ];
  
  if (documentTypes.includes(mimeType)) return 'document';
  
  return 'other';
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats an attachment with all required backend fields
 */
export function formatAttachmentForBackend(
  attachment: AttachmentInput,
  uploadedBy: string
): FormattedAttachment {
  const mimeType = attachment.mimeType || attachment.type || 'application/octet-stream';
  const fileType = getFileType(mimeType);
  
  return {
    ...attachment,
    fileName: attachment.fileName || attachment.name || 'unknown',
    originalName: attachment.originalName || attachment.name || attachment.fileName || 'unknown',
    mimeType,
    fileType,
    isImage: fileType === 'image',
    isVideo: fileType === 'video',
    isAudio: fileType === 'audio',
    isDocument: fileType === 'document',
    sizeFormatted: formatFileSize(attachment.size),
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
}
