import { http } from "@/core/http/axios";
import type { Conversation, Message } from "./types";
import { uploadChatMediaWithProgress, uploadConversationMediaWithProgress } from "@/shared/utils/upload-with-progress";

export type Paginated<T> = {
  items: T[];
  nextCursor?: string | null;
};

export async function getConversations(): Promise<Conversation[]> {
  console.log('[API] Fetching conversations...');
  const { data } = await http().get("/conversations");
  console.log('[API] Conversations fetched:', data.conversations?.length || data.length, 'conversations');
  return data.conversations || data;
}

export async function getConversationMessages(
  conversationId: string,
  cursor?: string
): Promise<{ items: Message[]; nextCursor?: string | null }> {
  const { data } = await http().get(`/conversations/${conversationId}/messages`, {
    params: cursor ? { cursor } : {},
  });
  
  // Backend returns { messages: [], pagination: { hasMore, prevCursor } }
  // Transform to match expected format
  return {
    items: data.messages || data.items || [],
    nextCursor: data.pagination?.prevCursor || data.nextCursor || null
  };
}

// Helper function to determine message type from attachments
function determineMessageType(
  attachments?: Array<{ type?: string; mimeType?: string }>,
  defaultType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'emoji' = 'text'
): 'text' | 'image' | 'video' | 'audio' | 'file' | 'emoji' {
  if (!attachments || attachments.length === 0) {
    return defaultType;
  }

  // If multiple attachments, prioritize by type: video > image > audio > file
  const types = attachments.map(att => {
    const mimeType = att.mimeType || att.type || '';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  });

  // Return the highest priority type
  if (types.includes('video')) return 'video';
  if (types.includes('image')) return 'image';
  if (types.includes('audio')) return 'audio';
  return 'file';
}

// Helper function to determine file type category
function determineFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (isDocumentType(mimeType)) return 'document';
  return 'other';
}

// Helper function to check if mime type is a document
function isDocumentType(mimeType: string): boolean {
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
  ];
  return documentTypes.includes(mimeType);
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function sendMessage(
  conversationId: string, 
  text: string,
  options?: {
    replyTo?: string;
    attachments?: Array<{
      id: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      key: string;
      fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
      isImage: boolean;
      isVideo: boolean;
      isAudio: boolean;
      isDocument: boolean;
      sizeFormatted: string;
      uploadedBy: string;
      uploadedAt: string;
    }>;
  }
): Promise<Message> {
  // Determine the correct message type based on attachments
  const messageType = determineMessageType(
    options?.attachments, 
    text.trim() ? 'text' : 'file' // Default to 'file' if no text and no attachments, 'text' if text exists
  );

  const requestData: Record<string, unknown> = { 
    conversation_id: conversationId,
    message_type: messageType,
    reply_to_id: options?.replyTo, // Backend expects reply_to_id
    attachments: options?.attachments,
  };

  // Only include content if there's actual text content
  if (text.trim()) {
    requestData.content = text;
  }

  const { data } = await http().post(`/conversations/${conversationId}/messages`, requestData);
  return data.message || data;
}

export async function generatePresignedUrls(
  conversationId: string,
  files: Array<{ name: string; type: string; size: number }>
): Promise<{
  urls: Array<{
    id: string;
    uploadUrl: string;
    publicUrl: string;
    key: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
}> {
  const { data } = await http().post('/conversations/generate-presigned-urls', {
    conversation_id: conversationId,
    files,
  });
  return data;
}

export async function createConversation(params: {
  type: 'direct' | 'group';
  participant_ids: string[];
  name?: string;
  description?: string;
}): Promise<Conversation> {
  const { data } = await http().post('/conversations', params);
  return data.conversation;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  await http().put(`/conversations/${conversationId}/mark-read`);
  console.log('[API] Marking conversation as read:', conversationId);
}

export async function toggleReaction(
  messageId: string,
  emoji: string
): Promise<{ reactions: Record<string, string[]> }> {
  console.log('[API] toggleReaction called:', { messageId, emoji });
  try {
    const { data } = await http().post<{ reactions: Record<string, string[]> }>(
      `/messages/${messageId}/reactions`,
      { emoji }
    );
    console.log('[API] toggleReaction response:', data);
    return data;
  } catch (error) {
    console.error('[API] toggleReaction error:', error);
    throw error;
  }
}

export async function forwardMessage(messageId: string, targetConversationId: string): Promise<Message> {
  const { data } = await http().post(`/messages/${messageId}/forward`, { 
    conversation_id: targetConversationId 
  });
  return data.message || data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await http().delete(`/messages/${messageId}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  console.log('[API] Deleting conversation:', conversationId);
  await http().delete(`/conversations/${conversationId}`);
  console.log('[API] Conversation deleted:', conversationId);
}

export async function updateConversation(
  conversationId: string, 
  data: {
    name?: string;
    description?: string;
    avatar_url?: string;
  }
): Promise<Conversation> {
  console.log('[API] Updating conversation:', conversationId, data);
  const { data: response } = await http().put(`/conversations/${conversationId}`, data);
  console.log('[API] Conversation updated:', conversationId);
  return response.conversation;
}

export async function uploadFile(
  file: File,
  folder: string = 'avatars'
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("processImage", "true");

  const { data } = await http().post("/uploads/file", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return {
    url: data.file?.url,
    key: data.file?.key,
  };
}

export async function uploadChatMedia(
  conversationId: string,
  files: File[]
): Promise<{
  success: boolean;
  files: Array<{
    id: string;
    url: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    type: string;
  }>;
}> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await http().post(`/conversations/${conversationId}/upload-media`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function sendMessageWithFiles(
  conversationId: string,
  text: string,
  files: File[],
  options?: {
    replyTo?: string;
    onProgress?: (fileIndex: number, progress: number) => void;
    onFileComplete?: (fileIndex: number, result: unknown) => void;
  }
): Promise<Message> {
  // FAST UPLOAD: Use presigned URLs for direct S3/R2 upload (like class updates)
  // This replaces the slow FormData multipart upload that took 11+ seconds
  const uploadStartTime = Date.now();
  const uploadResult = await uploadConversationMediaWithProgress(conversationId, files, {
    onProgress: options?.onProgress,
    onFileComplete: options?.onFileComplete,
  });
  
  const uploadTime = Date.now() - uploadStartTime;
  console.log(`[API] ⚡ FAST upload completed in ${uploadTime}ms!`, { 
    filesUploaded: uploadResult.files.length,
    averageTimePerFile: Math.round(uploadTime / files.length)
  });
  
  // Transform uploaded files to attachments format matching backend MessageAttachment interface
  const attachments = uploadResult.files.map(file => ({
    id: file.id,
    fileName: file.fileName,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    url: file.url,
    key: file.id, // Use file id as key
    fileType: determineFileType(file.mimeType),
    isImage: file.mimeType.startsWith('image/'),
    isVideo: file.mimeType.startsWith('video/'),
    isAudio: file.mimeType.startsWith('audio/'),
    isDocument: isDocumentType(file.mimeType),
    sizeFormatted: formatFileSize(file.size),
    uploadedBy: '', // Will be set by backend
    uploadedAt: new Date().toISOString(),
  }));

  // Then send the message with attachments
  return sendMessage(conversationId, text, {
    replyTo: options?.replyTo,
    attachments,
  });
}
