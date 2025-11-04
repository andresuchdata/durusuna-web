"use client";

import { useParams } from "next/navigation";
import { useConversationMessages, useSendMessage } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatRealtime } from "@/domains/chat/realtime";

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;
  const { items, isLoading, error, hasMore, loadMore } = useConversationMessages(conversationId);
  const { data: profile } = useProfile();
  const me = profile?.id ?? null;

  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const { mutateAsync: send, isPending } = useSendMessage(conversationId);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // realtime typing indicator
  useChatRealtime(conversationId, {
    onTypingStart: () => setTheirTyping(true),
    onTypingStop: () => setTheirTyping(false),
  });

  // emit typing events with debounce
  useEffect(() => {
    if (!isTyping) return;
    const t = setTimeout(() => setIsTyping(false), 1200);
    return () => clearTimeout(t);
  }, [isTyping]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await send({ text });
    setText("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="px-4 py-3 bg-white dark:bg-[#134e3a] border-b border-border flex items-center justify-between shadow-sm">
        <div>
          <div className="font-semibold text-lg">Conversation</div>
          {theirTyping && <div className="text-xs text-emerald-600">typing…</div>}
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] dark:bg-[#0a3622]">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading messages…</div>
          ) : error ? (
            <div className="text-sm text-red-600">Failed to load messages</div>
          ) : (
            <>
              {hasMore && (
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={loadMore}>Load more</Button>
                </div>
              )}
              <div className="space-y-2">
                {items.map((m) => (
                  <MessageItem key={m.id || m.serverId} m={m} me={me} />)
                )}
              </div>
            </>
          )}
        </div>

        {/* Composer - Fixed */}
        <form onSubmit={onSend} className="sticky bottom-0 p-3 md:p-4 border-t bg-white dark:bg-[#134e3a] flex gap-2 shadow-lg">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setIsTyping(true);
            }}
            placeholder="Type a message"
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={isPending || !text.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            Send
          </Button>
        </form>
    </div>
  );
}
