"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/core/realtime/socket";
import type { Message } from "./types";

type BackendReplyTo = {
  id: string;
  content?: string | null;
  sender_name?: string | null;
  sender_id?: string | null;
  message_type?: string | null;
};

type BackendMessage = {
  id: string;
  conversation_id?: string | null;
  conversationId?: string | null;
  sender_id?: string | null;
  senderId?: string | null;
  sender?: Message["sender"];
  content?: string | null;
  text?: string | null;
  attachments?: Message["attachments"];
  metadata?: Record<string, unknown> | string | null;
  created_at?: string;
  createdAt?: string;
  read_status?: "read" | "delivered" | "sent" | null;
  reactions?: Message["reactions"];
  reply_to_id?: string;
  reply_to?: BackendReplyTo | null;
  message_type?: string;
};

type MessageNewEvent = {
  conversationId?: string;
  conversation_id?: string;
  message?: BackendMessage;
};

type TypingEvent = {
  conversationId?: string;
  conversation_id?: string;
  userId?: string;
  user_id?: string;
};

type ReactionUpdateEvent = {
  conversationId?: string;
  conversation_id?: string;
  messageId?: string;
  message_id?: string;
  reactions?: Record<string, string[]>;
};

// Transform backend message format to frontend format
function transformMessage(backendMessage: BackendMessage): Message {
  // Explicitly handle reply_to to ensure it's properly preserved
  let reply_to: Message['reply_to'] = undefined;
  if (backendMessage.reply_to) {
    reply_to = {
      id: backendMessage.reply_to.id,
      content: backendMessage.reply_to.content ?? '',
      sender_name: backendMessage.reply_to.sender_name ?? '',
      sender_id: backendMessage.reply_to.sender_id ?? undefined,
      message_type: backendMessage.reply_to.message_type ?? undefined,
    };
  }

  // Handle null content explicitly - backend returns null when there's no text
  const messageContent = backendMessage.content !== null && backendMessage.content !== undefined
    ? backendMessage.content
    : backendMessage.text !== null && backendMessage.text !== undefined
    ? backendMessage.text
    : undefined;
  
  // Extract attachments from metadata if they exist
  let attachments = backendMessage.attachments ?? [];
  
  if (backendMessage.metadata && typeof backendMessage.metadata === 'object') {
    const metadataAttachments = (backendMessage.metadata as Record<string, unknown>).attachments;
    if (Array.isArray(metadataAttachments)) {
      attachments = metadataAttachments;
    }
  }
  // Also try parsing metadata if it's a string
  else if (typeof backendMessage.metadata === 'string') {
    try {
      const parsedMetadata = JSON.parse(backendMessage.metadata) as Record<string, unknown>;
      if (parsedMetadata.attachments && Array.isArray(parsedMetadata.attachments)) {
        attachments = parsedMetadata.attachments;
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return {
    id: backendMessage.id,
    serverId: backendMessage.id,
    conversationId: backendMessage.conversation_id ?? backendMessage.conversationId ?? undefined,
    conversation_id: backendMessage.conversation_id ?? undefined,
    senderId: backendMessage.sender_id ?? backendMessage.senderId ?? undefined,
    sender_id: backendMessage.sender_id ?? undefined,
    sender: backendMessage.sender,
    text: messageContent,
    content: messageContent,
    attachments: attachments,
    createdAt: backendMessage.created_at ?? backendMessage.createdAt,
    created_at: backendMessage.created_at ?? undefined,
    status: backendMessage.read_status === 'read' ? 'read' : 
            backendMessage.read_status === 'delivered' ? 'delivered' : 'sent',
    reactions: backendMessage.reactions ?? {},
    reply_to_id: backendMessage.reply_to_id ?? undefined, // Preserve reply_to_id for frontend population
    reply_to: reply_to,
    message_type: backendMessage.message_type, // Preserve message_type for populating reply_to
  };
}

export function useChatRealtime(
  conversationId: string,
  handlers: {
    onMessageNew?: (m: Message) => void;
    onTypingStart?: (userId: string) => void;
    onTypingStop?: (userId: string) => void;
    onReactionUpdate?: (messageId: string, reactions: Record<string, string[]>) => void;
  }
) {
  // Use refs to store handlers so they're always up to date
  const handlersRef = useRef(handlers);
  
  // Update handlers ref without triggering re-render
  // Use useLayoutEffect to update before other effects run
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!conversationId) return;
    
    const socket = getSocket();
    
    // Wait for socket to connect before joining room
    const joinRoom = () => {
      socket.emit("conversation:join", { conversationId });
    };
    
    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    function onMessageNew(data: MessageNewEvent) {
      const msgConvId = data.conversationId || data.conversation_id || data.message?.conversation_id;
      if (msgConvId !== conversationId) {
        console.log('[Realtime] Message not for this conversation', { msgConvId, conversationId });
        return;
      }
      
      // Transform backend message format to frontend format
      const backendMessage = data.message;
      if (!backendMessage) {
        console.warn('[Realtime] No message in data');
        return;
      }

      const transformedMessage = transformMessage(backendMessage);
      handlersRef.current.onMessageNew?.(transformedMessage);
    }

    function onTypingStart(data: TypingEvent) {
      if (data.conversationId !== conversationId && data.conversation_id !== conversationId) return;
      const userId = data.userId || data.user_id;
      if (userId) {
        handlersRef.current.onTypingStart?.(userId);
      }
    }

    function onTypingStop(data: TypingEvent) {
      if (data.conversationId !== conversationId && data.conversation_id !== conversationId) return;
      const userId = data.userId || data.user_id;
      if (userId) {
        handlersRef.current.onTypingStop?.(userId);
      }
    }

    function onReactionUpdate(data: ReactionUpdateEvent) {
      if (data.conversationId !== conversationId && data.conversation_id !== conversationId) return;
      const messageId = data.messageId || data.message_id;
      const reactions: Record<string, string[]> = data.reactions ?? {};
      if (messageId) {
        handlersRef.current.onReactionUpdate?.(messageId, reactions);
      }
    }

    socket.on("message:new", onMessageNew);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:reaction_updated", onReactionUpdate);

    return () => {
      if (socket.connected) {
        socket.emit("conversation:leave", { conversationId });
      }
      socket.off("connect", joinRoom);
      socket.off("message:new", onMessageNew);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:reaction_updated", onReactionUpdate);
    };
  }, [conversationId]);
}

