"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useConversations } from "@/domains/chat/hooks";
import { ConversationItem } from "@/domains/chat/components/ConversationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, Edit, Video, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatsPage() {
  const { data, isLoading, error, refetch } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedConversation = data?.find(c => c.id === selectedId);

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* Conversations List */}
        <div className="w-full md:w-96 border-r border-border bg-white dark:bg-[#111b21] flex-shrink-0 overflow-hidden flex flex-col">
          {/* WhatsApp-style Header */}
          <div className="bg-[#008069] dark:bg-[#008069] px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Chats</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a3942] h-9 w-9 p-0">
                <Edit className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#2a3942] h-9 w-9 p-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="p-2 bg-white dark:bg-[#111b21]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or start new chat"
                className="pl-10 bg-[#f0f2f5] dark:bg-[#202c33] border-0 rounded-lg"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21]">
            {isLoading ? (
              <div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border-b border-border dark:border-[#2a3942]">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600 mb-2">Failed to load conversations</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : data && data.length > 0 ? (
              <div>
                {data.map((c) => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer">
                    <ConversationItem c={c} isSelected={selectedId === c.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No conversations yet.</p>
                <p className="text-sm mt-2">Start a new conversation to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Detail or Empty State */}
        <div className="hidden md:flex flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a]">
          {selectedId && selectedConversation ? (
            <>
              {/* WhatsApp-style Conversation Header */}
              <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 flex items-center justify-between border-b border-border dark:border-[#2a3942]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={
                      (selectedConversation.type === 'direct' && selectedConversation.other_user
                        ? selectedConversation.other_user.avatar_url
                        : selectedConversation.avatar_url) || undefined
                    } />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {(() => {
                        if (selectedConversation.type === 'direct' && selectedConversation.other_user) {
                          return `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`.charAt(0).toUpperCase();
                        }
                        return (selectedConversation.name || 'C').charAt(0).toUpperCase();
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-base">
                      {selectedConversation.type === 'direct' && selectedConversation.other_user
                        ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                        : selectedConversation.name || 'Conversation'}
                    </h2>
                    <p className="text-xs text-muted-foreground">online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Messages */}
              <ConversationDetail conversationId={selectedId} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-md px-6">
                <div className="w-24 h-24 mx-auto bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Durusuna Web</h2>
                <p className="text-muted-foreground">
                  Select a conversation from the list to start messaging
                </p>
                <p className="text-sm text-muted-foreground">
                  Send and receive messages, share files, and stay connected with your school community
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Conversation Detail Component
function ConversationDetail({ conversationId }: { conversationId: string }) {
  const { items, isLoading, error, hasMore, loadMore } = useConversationMessages(conversationId);
  const { data: profile } = useProfile();
  const me = profile?.id ?? null;
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const { mutateAsync: send, isPending } = useSendMessage(conversationId);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useChatRealtime(conversationId, {
    onTypingStart: () => setTheirTyping(true),
    onTypingStop: () => setTheirTyping(false),
  });

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
    <div className="flex flex-col h-full w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] dark:bg-[#0b141a]">
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
            {items.map((msg) => (
              <MessageItem key={msg.id} m={msg} me={me} />
            ))}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="p-4 bg-white dark:bg-card border-t border-border">
        <form onSubmit={onSend} className="flex gap-2">
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
    </div>
  );
}

// Import required hooks
import { useConversationMessages, useSendMessage } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { useChatRealtime } from "@/domains/chat/realtime";
import { useEffect, useRef } from "react";
