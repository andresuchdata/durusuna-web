/**
 * Shared attachment type used across the application
 * Supports both chat messages and class updates
 */
export interface AttachmentData {
  /** Unique identifier for the attachment */
  id: string;
  
  /** Public URL to access the file */
  url: string;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type (e.g., 'image/jpeg', 'application/pdf') */
  mimeType?: string;
  
  /** File type (alternative to mimeType, sometimes used for categorization) */
  type?: string;
  
  /** Original filename when uploaded */
  originalName?: string;
  
  /** Display name (may differ from originalName) */
  name?: string;
  
  /** File name (alternative to name/originalName) */
  fileName?: string;
  
  /** Storage key/path in S3/R2 */
  key?: string;
  
  /** Human-readable formatted file size (e.g., "2.5 MB") */
  sizeFormatted?: string;
}

/**
 * Helper function to get the display name from an attachment
 * Tries multiple fields in order of preference
 */
export function getAttachmentDisplayName(attachment: AttachmentData): string {
  return attachment.name || 
         attachment.originalName || 
         attachment.fileName || 
         'Unknown file';
}

/**
 * Helper function to get the MIME type from an attachment
 * Falls back to type field if mimeType is not available
 */
export function getAttachmentMimeType(attachment: AttachmentData): string {
  return attachment.mimeType || attachment.type || 'application/octet-stream';
}

/**
 * Helper function to format file size if not already formatted
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper function to get formatted file size from attachment
 * Uses sizeFormatted if available, otherwise formats size
 */
export function getAttachmentSizeFormatted(attachment: AttachmentData): string {
  return attachment.sizeFormatted || formatFileSize(attachment.size);
}
