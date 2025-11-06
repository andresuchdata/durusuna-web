"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversations, getConversationMessages, sendMessage } from "./api";
import type { Conversation, Message } from "./types";
import { useChatRealtime } from "./realtime";

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["chat", "conversations"],
    queryFn: getConversations,
    staleTime: 10_000,
  });
}

export function useConversationMessages(conversationId: string) {
  const qc = useQueryClient();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const { data, isLoading, error } = useQuery<{ items: Message[]; nextCursor?: string | null }>({
    queryKey: ["chat", "messages", conversationId, "initial"],
    queryFn: () => getConversationMessages(conversationId, undefined),
    staleTime: 10_000,
  });

  // Initialize messages from initial query
  useEffect(() => {
    if (data?.items) {
      setAllMessages(data.items);
      setNextCursor(data.nextCursor ?? null);
    }
  }, [data]);

  // Load more handler
  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const result = await getConversationMessages(conversationId, nextCursor);
      // Prepend older messages
      setAllMessages((prev) => [...result.items, ...prev]);
      setNextCursor(result.nextCursor ?? null);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // realtime add
  useChatRealtime(conversationId, {
    onMessageNew(m) {
      if (m.conversationId !== conversationId) return;
      // Append new message at the end
      setAllMessages((prev) => [...prev, m]);
      // Also update query cache
      qc.setQueryData<{ items: Message[]; nextCursor?: string | null }>(
        ["chat", "messages", conversationId, "initial"],
        (old) => ({ items: [...(old?.items ?? []), m], nextCursor: old?.nextCursor ?? null })
      );
    },
  });

  return {
    items: allMessages,
    isLoading: isLoading || isLoadingMore,
    error,
    hasMore: !!nextCursor,
    loadMore,
  };
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { 
      text: string; 
      replyTo?: string;
      attachments?: Array<{ id: string; url: string; type: string; name: string; size: number }>;
    }) => sendMessage(conversationId, payload.text, {
      replyTo: payload.replyTo,
      attachments: payload.attachments,
    }),
    onSuccess: (m) => {
      // optimistic append handled by realtime too, but ensure UI updates
      qc.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
      return m;
    },
  });
}
