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
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useQuery<{ items: Message[]; nextCursor?: string | null }>({
    queryKey: ["chat", "messages", conversationId, cursor ?? "initial"],
    queryFn: () => getConversationMessages(conversationId, cursor),
  });

  const items = data?.items ?? [];
  const nextCursor = data?.nextCursor ?? null;

  // realtime add
  useChatRealtime(conversationId, {
    onMessageNew(m) {
      if (m.conversationId !== conversationId) return;
      qc.setQueryData<{ items: Message[]; nextCursor?: string | null }>(
        ["chat", "messages", conversationId, cursor ?? "initial"],
        (old) => ({ items: [...(old?.items ?? []), m], nextCursor: old?.nextCursor ?? null })
      );
    },
  });

  return {
    items,
    isLoading,
    error,
    hasMore: !!nextCursor,
    loadMore: () => setCursor(nextCursor ?? undefined),
  };
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { text: string }) => sendMessage(conversationId, payload.text),
    onSuccess: (m) => {
      // optimistic append handled by realtime too, but ensure UI updates
      qc.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
      return m;
    },
  });
}
