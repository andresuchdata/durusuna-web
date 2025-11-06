"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/core/realtime/socket";
import type { Message } from "./types";

// Transform backend message format to frontend format
function transformMessage(backendMessage: any): Message {
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
    reply_to: backendMessage.reply_to || undefined,
  };
}

export function useChatRealtime(
  conversationId: string,
  handlers: {
    onMessageNew?: (m: Message) => void;
    onTypingStart?: (userId: string) => void;
    onTypingStop?: (userId: string) => void;
    onReactionUpdate?: (messageId: string, reactions: Record<string, any>) => void;
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
    console.log('[Realtime] Socket connected:', socket.connected);
    console.log('[Realtime] Socket ID:', socket.id);
    console.log('[Realtime] Joining conversation:', conversationId);
    
    // Wait for socket to connect before joining room
    const joinRoom = () => {
      console.log('[Realtime] Socket is connected, joining room');
      socket.emit("conversation:join", { conversationId });
      console.log('[Realtime] Emitted conversation:join', { conversationId });
    };
    
    if (socket.connected) {
      joinRoom();
    } else {
      console.log('[Realtime] Socket not connected, waiting for connection...');
      socket.once('connect', joinRoom);
    }

    function onMessageNew(data: any) {
      console.log('[Realtime] Received message:new', data);
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
      console.log('[Realtime] Transformed message:', transformedMessage);
      handlersRef.current.onMessageNew?.(transformedMessage);
    }

    function onTypingStart(data: any) {
      console.log('[Realtime] Received typing:start', data);
      if (data?.conversationId !== conversationId && data?.conversation_id !== conversationId) return;
      handlersRef.current.onTypingStart?.(data?.userId || data?.user_id);
    }

    function onTypingStop(data: any) {
      console.log('[Realtime] Received typing:stop', data);
      if (data?.conversationId !== conversationId && data?.conversation_id !== conversationId) return;
      handlersRef.current.onTypingStop?.(data?.userId || data?.user_id);
    }

    function onReactionUpdate(data: any) {
      console.log('[Realtime] Received message:reaction_updated', data);
      if (data?.conversationId !== conversationId && data?.conversation_id !== conversationId) return;
      const messageId = data?.messageId || data?.message_id;
      const reactions = data?.reactions || {};
      if (messageId) {
        handlersRef.current.onReactionUpdate?.(messageId, reactions);
      }
    }

    socket.on("message:new", onMessageNew);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("message:reaction_updated", onReactionUpdate);

    return () => {
      console.log('[Realtime] Leaving conversation:', conversationId);
      if (socket.connected) {
        socket.emit("conversation:leave", { conversationId });
        console.log('[Realtime] Emitted conversation:leave', { conversationId });
      }
      socket.off("connect", joinRoom);
      socket.off("message:new", onMessageNew);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("message:reaction_updated", onReactionUpdate);
      console.log('[Realtime] Removed event listeners for conversation:', conversationId);
    };
  }, [conversationId]);
}

