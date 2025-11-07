"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/core/realtime/socket";
import type { Message } from "./types";

// Transform backend message format to frontend format
function transformMessage(backendMessage: any): Message {
  // Explicitly handle reply_to to ensure it's properly preserved
  let reply_to: Message['reply_to'] = undefined;
  if (backendMessage.reply_to) {
    reply_to = {
      id: backendMessage.reply_to.id,
      content: backendMessage.reply_to.content || '',
      sender_name: backendMessage.reply_to.sender_name || '',
      sender_id: backendMessage.reply_to.sender_id,
      message_type: backendMessage.reply_to.message_type,
    };
  }

  return {
    id: backendMessage.id,
    serverId: backendMessage.id,
    conversationId: backendMessage.conversation_id || backendMessage.conversationId,
    conversation_id: backendMessage.conversation_id,
    senderId: backendMessage.sender_id || backendMessage.senderId,
    sender_id: backendMessage.sender_id,
    sender: backendMessage.sender,
    text: backendMessage.content || backendMessage.text,
    content: backendMessage.content || backendMessage.text,
    attachments: backendMessage.attachments || [],
    createdAt: backendMessage.created_at || backendMessage.createdAt,
    created_at: backendMessage.created_at,
    status: backendMessage.read_status === 'read' ? 'read' : 
            backendMessage.read_status === 'delivered' ? 'delivered' : 'sent',
    reactions: backendMessage.reactions || {},
    reply_to_id: backendMessage.reply_to_id, // Preserve reply_to_id for frontend population
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

    function onMessageNew(data: any) {
      const msgConvId = data?.conversationId || data?.conversation_id || data?.message?.conversation_id;
      if (msgConvId !== conversationId) {
        console.log('[Realtime] Message not for this conversation', { msgConvId, conversationId });
        return;
      }
      
      // Transform backend message format to frontend format
      const backendMessage = data?.message;
      if (!backendMessage) {
        console.warn('[Realtime] No message in data');
        return;
      }

      const transformedMessage = transformMessage(backendMessage);
      handlersRef.current.onMessageNew?.(transformedMessage);
    }

    function onTypingStart(data: any) {
      if (data?.conversationId !== conversationId && data?.conversation_id !== conversationId) return;
      handlersRef.current.onTypingStart?.(data?.userId || data?.user_id);
    }

    function onTypingStop(data: any) {
      if (data?.conversationId !== conversationId && data?.conversation_id !== conversationId) return;
      handlersRef.current.onTypingStop?.(data?.userId || data?.user_id);
    }

    function onReactionUpdate(data: any) {
      if (data?.conversationId !== conversationId && data?.conversation_id !== conversationId) return;
      const messageId = data?.messageId || data?.message_id;
      const reactions: Record<string, string[]> = data?.reactions ?? {};
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

