"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getConversations, 
  getConversationMessages, 
  sendMessage, 
  createConversation, 
  markConversationAsRead,
  toggleReaction,
  deleteMessage,
  forwardMessage,
  updateConversation,
  uploadFile
} from "./api";
import type { Conversation, Message } from "./types";
import { useChatRealtime } from "./realtime";

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["chat", "conversations"],
    queryFn: getConversations,
    staleTime: 5_000, // Reduced to 5 seconds for faster updates
    refetchOnWindowFocus: true,
  });
}

export function useConversationMessages(conversationId: string) {
  const qc = useQueryClient();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
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

  // Helper function to populate reply_to from reply_to_id using existing messages
  const populateReplyTo = (message: Message, allMessages: Message[]): Message => {
    // If reply_to already exists, use it
    if (message.reply_to) {
      return message;
    }

    // If we have reply_to_id but no reply_to object, look it up
    const replyToId = message.reply_to_id;
    if (replyToId) {
      const originalMessage = allMessages.find(msg => msg.id === replyToId);
      if (originalMessage) {
        return {
          ...message,
          reply_to: {
            id: originalMessage.id,
            content: originalMessage.content || originalMessage.text || '',
            sender_name: originalMessage.sender
              ? `${originalMessage.sender.first_name} ${originalMessage.sender.last_name}`
              : 'Unknown',
            sender_id: originalMessage.sender_id || originalMessage.senderId,
            message_type: originalMessage.message_type || 'text',
          },
        };
      }
    }

    return message;
  };

  // Listen for custom reaction update events (from mutations)
  useEffect(() => {
    const handleCustomReactionUpdate = (event: CustomEvent) => {
      const { messageId, reactions, conversationId: eventConvId } = event.detail;
      if (eventConvId === conversationId && messageId && reactions) {
        console.log('Custom reaction update event received:', { messageId, reactions });
        // Trigger the onReactionUpdate handler
        setAllMessages((prev) => 
          prev.map((msg) => {
            const matches = msg.id === messageId || msg.serverId === messageId;
            if (matches) {
              console.log('Updating message reactions from custom event:', msg.id || msg.serverId, reactions);
              return { ...msg, reactions };
            }
            return msg;
          })
        );
      }
    };
    
    window.addEventListener('message:reaction_updated', handleCustomReactionUpdate as EventListener);
    return () => {
      window.removeEventListener('message:reaction_updated', handleCustomReactionUpdate as EventListener);
    };
  }, [conversationId]);

  // realtime add
  useChatRealtime(conversationId, {
    onMessageNew(m) {
      const msgConvId = m.conversationId || m.conversation_id;
      
      if (msgConvId !== conversationId) {
        return;
      }
      
      // Append new message at the end, or update if it already exists
      setAllMessages((prev) => {
        // First, populate reply_to if we have reply_to_id
        const messageWithReplyTo = populateReplyTo(m, prev);
        
        // Check if message already exists
        const existingIndex = prev.findIndex(msg => msg.id === messageWithReplyTo.id);
        if (existingIndex !== -1) {
          // Merge existing message with new data (especially to get reply_to if it was missing)
          const existing = prev[existingIndex];
          const merged = {
            ...existing,
            ...messageWithReplyTo,
            // Preserve existing data but prefer new data for reply_to
            reply_to: messageWithReplyTo.reply_to || existing.reply_to,
            // Merge other fields that might be updated
            reactions: messageWithReplyTo.reactions || existing.reactions,
            status: messageWithReplyTo.status || existing.status,
          };

          const updated = [...prev];
          updated[existingIndex] = merged;

          return updated;
        }

        return [...prev, messageWithReplyTo];
      });
      
      // Also update query cache
      qc.setQueryData<{ items: Message[]; nextCursor?: string | null }>(
        ["chat", "messages", conversationId, "initial"],
        (old) => {
          if (!old) return old;
          
          // Populate reply_to from existing messages in cache
          const messageWithReplyTo = populateReplyTo(m, old.items);
          
          const existingIndex = old.items.findIndex(msg => msg.id === messageWithReplyTo.id);
          if (existingIndex !== -1) {
            // Merge existing message with new data
            const existing = old.items[existingIndex];
            const merged = {
              ...existing,
              ...messageWithReplyTo,
              reply_to: messageWithReplyTo.reply_to || existing.reply_to,
              reactions: messageWithReplyTo.reactions || existing.reactions,
              status: messageWithReplyTo.status || existing.status,
            };
            const updated = [...old.items];
            updated[existingIndex] = merged;
            return { ...old, items: updated };
          }
          return { items: [...old.items, messageWithReplyTo], nextCursor: old.nextCursor ?? null };
        }
      );
    },
    onReactionUpdate(messageId: string, reactions: Record<string, string[]>) {
      console.log('onReactionUpdate called:', { messageId, reactions });
      // Update message in state - match by either id or serverId
      setAllMessages((prev) => 
        prev.map((msg) => {
          const matches = msg.id === messageId || msg.serverId === messageId;
          if (matches) {
            console.log('Updating message reactions in local state:', msg.id || msg.serverId, reactions);
            return { ...msg, reactions };
          }
          return msg;
        })
      );
      
      // Also update query cache
      qc.setQueryData<{ items: Message[]; nextCursor?: string | null }>(
        ["chat", "messages", conversationId, "initial"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((msg) => {
              const matches = msg.id === messageId || msg.serverId === messageId;
              if (matches) {
                return { ...msg, reactions };
              }
              return msg;
            }),
          };
        }
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

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      type: 'direct' | 'group';
      participant_ids: string[];
      name?: string;
      description?: string;
    }) => createConversation(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useMarkConversationAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      // Update the conversations list to reset unread count
      qc.setQueryData<Conversation[]>(["chat", "conversations"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((conv) =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        );
      });
      // Don't invalidate immediately - let the caller control when to refetch
      // to avoid race conditions with backend processing
    },
  });
}

export function useToggleReaction(conversationId: string) {
  const qc = useQueryClient();
  console.log('useToggleReaction hook initialized with conversationId:', conversationId);
  
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      console.log('useToggleReaction mutationFn called:', { messageId, emoji, conversationId });
      if (!messageId) {
        console.error('Message ID is missing in mutationFn');
        throw new Error('Message ID is required');
      }
      if (!emoji) {
        console.error('Emoji is missing in mutationFn');
        throw new Error('Emoji is required');
      }
      console.log('Calling toggleReaction API...');
      return toggleReaction(messageId, emoji);
    },
    onSuccess: (data, variables) => {
      console.log('useToggleReaction onSuccess:', { data, variables });
      // Update the message in the cache with new reactions
      qc.setQueryData<{ items: Message[]; nextCursor?: string | null }>(
        ["chat", "messages", conversationId, "initial"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((msg) => {
              // Match by either id or serverId
              const matches = msg.id === variables.messageId || msg.serverId === variables.messageId;
              if (matches) {
                console.log('Updating message reactions in cache:', msg.id || msg.serverId, data.reactions);
                return { ...msg, reactions: data.reactions };
              }
              return msg;
            }),
          };
        }
      );
      
      // Also trigger a custom event to update local state immediately
      // This will be picked up by useConversationMessages if it's listening
      // For now, we rely on the realtime event, but this ensures cache is updated
      window.dispatchEvent(new CustomEvent('message:reaction_updated', {
        detail: {
          messageId: variables.messageId,
          reactions: data.reactions,
          conversationId,
        },
      }));
    },
    onError: (error) => {
      console.error('useToggleReaction error:', error);
    },
  });
}

export function useDeleteMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      // Remove the message from the cache
      qc.setQueryData<{ items: Message[]; nextCursor?: string | null }>(
        ["chat", "messages", conversationId, "initial"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((msg) => msg.id !== messageId),
          };
        }
      );
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useForwardMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, targetConversationId }: { messageId: string; targetConversationId: string }) =>
      forwardMessage(messageId, targetConversationId),
    onSuccess: () => {
      // Invalidate conversations to show the new message
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, data }: { 
      conversationId: string; 
      data: { name?: string; description?: string; avatar_url?: string }
    }) => updateConversation(conversationId, data),
    onSuccess: (updatedConversation) => {
      // Update the conversation in the cache
      qc.setQueryData<Conversation[]>(["chat", "conversations"], (old) => {
        if (!old) return old;
        return old.map((conv) =>
          conv.id === updatedConversation.id ? { ...conv, ...updatedConversation } : conv
        );
      });
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) =>
      uploadFile(file, folder),
  });
}
