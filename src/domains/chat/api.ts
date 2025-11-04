import { http } from "@/core/http/axios";
import type { Conversation, Message } from "./types";

export type Paginated<T> = {
  items: T[];
  nextCursor?: string | null;
};

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await http().get("/conversations");
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

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  const { data } = await http().post(`/conversations/${conversationId}/messages`, { text });
  return data;
}
