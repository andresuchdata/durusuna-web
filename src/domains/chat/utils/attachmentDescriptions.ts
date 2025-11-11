import type { Message } from '../types';

/**
 * Generates a human-readable description of attachments in a message
 * Returns descriptions like "2 photos", "3 videos", "5 documents", or "8 files/media" for mixed types
 */
export function generateAttachmentDescription(message: Message): string | null {
  const attachments = message.attachments;
  
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Count different types of attachments
  let images = 0;
  let videos = 0;
  let audios = 0;
  let documents = 0;
  let others = 0;

  attachments.forEach((attachment) => {
    const type = attachment.mimeType || attachment.type || '';
    
    if (type.startsWith('image/')) {
      images++;
    } else if (type.startsWith('video/')) {
      videos++;
    } else if (type.startsWith('audio/')) {
      audios++;
    } else if (
      type === 'application/pdf' ||
      type.includes('word') ||
      type.includes('document') ||
      type.includes('spreadsheet') ||
      type.includes('presentation') ||
      type.includes('excel') ||
      type.includes('powerpoint') ||
      type.includes('text')
    ) {
      documents++;
    } else {
      others++;
    }
  });

  const totalCount = attachments.length;
  const typeCount = [images > 0 ? 1 : 0, videos > 0 ? 1 : 0, audios > 0 ? 1 : 0, documents > 0 ? 1 : 0, others > 0 ? 1 : 0].filter(Boolean).length;

  // If mixed types (more than one type) or has "other" files, use generic description
  if (typeCount > 1 || others > 0) {
    return `${totalCount} files/media`;
  }

  // Single type descriptions
  if (images > 0) {
    return images === 1 ? '1 photo' : `${images} photos`;
  }
  
  if (videos > 0) {
    return videos === 1 ? '1 video' : `${videos} videos`;
  }
  
  if (audios > 0) {
    return audios === 1 ? '1 audio' : `${audios} audio files`;
  }
  
  if (documents > 0) {
    return documents === 1 ? '1 document' : `${documents} documents`;
  }

  // Fallback (shouldn't reach here, but just in case)
  return `${totalCount} files`;
}
