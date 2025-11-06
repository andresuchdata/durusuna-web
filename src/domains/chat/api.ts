import { http } from "@/core/http/axios";
import type { Conversation, Message } from "./types";

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

export async function sendMessage(
  conversationId: string, 
  text: string,
  options?: {
    replyTo?: string;
    attachments?: Array<{ id: string; url: string; type: string; name: string; size: number }>;
  }
): Promise<Message> {
  const { data } = await http().post(`/conversations/${conversationId}/messages`, { 
    conversation_id: conversationId,
    content: text,
    message_type: options?.attachments && options.attachments.length > 0 ? 'media' : 'text',
    reply_to: options?.replyTo,
    attachments: options?.attachments,
  });
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
}
