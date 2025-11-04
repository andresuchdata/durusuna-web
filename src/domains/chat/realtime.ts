"use client";

import { useEffect } from "react";
import { getSocket } from "@/core/realtime/socket";
import type { Message } from "./types";

export function useChatRealtime(
  conversationId: string,
  handlers: {
    onMessageNew?: (m: Message) => void;
    onTypingStart?: (userId: string) => void;
    onTypingStop?: (userId: string) => void;
  }
) {
  useEffect(() => {
    const socket = getSocket();
    // join room
    socket.emit("conversation:join", { conversationId });

    function onMessageNew(data: any) {
      if (data?.conversationId !== conversationId) return;
      const m = data?.message as Message;
      handlers.onMessageNew?.(m);
    }

    function onTypingStart(data: any) {
      if (data?.conversationId !== conversationId) return;
      handlers.onTypingStart?.(data?.userId);
    }

    function onTypingStop(data: any) {
      if (data?.conversationId !== conversationId) return;
      handlers.onTypingStop?.(data?.userId);
    }

    socket.on("message:new", onMessageNew);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", onMessageNew);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [conversationId]);
}
