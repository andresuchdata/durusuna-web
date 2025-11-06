"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useConversations } from "@/domains/chat/hooks";
import { ConversationItem } from "@/domains/chat/components/ConversationItem";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, Edit, Video, Phone, ArrowLeft, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/contexts/SidebarContext";
import { getSocket } from "@/core/realtime/socket";
import { Message } from "@/domains/chat/types";
import { NewConversationDialog } from "@/components/conversations/NewConversationDialog";
import { TypingIndicator } from "@/domains/chat/components/TypingIndicator";
import { AnimatePresence } from "framer-motion";

export default function ChatsPage() {
  const { data, isLoading, error } = useConversations();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [typingInConversations, setTypingInConversations] = useState<Set<string>>(new Set());
  const selectedConversation = data?.find(c => c.id === selectedId);
  const { toggleMobileSidebar } = useSidebar();
  const { mutate: markAsRead } = useMarkConversationAsRead();

  // Join all conversation rooms on mount
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const socket = getSocket();
    console.log(`[ChatsPage] Joining ${data.length} conversation rooms`);
    
    // Join all conversation rooms to receive events
    data.forEach(conversation => {
      socket.emit("conversation:join", { conversationId: conversation.id });
    });
    
    return () => {
      // Leave all rooms on unmount
      console.log(`[ChatsPage] Leaving ${data.length} conversation rooms`);
      data.forEach(conversation => {
        socket.emit("conversation:leave", { conversationId: conversation.id });
      });
    };
  }, [data]);

  // Store refs to prevent handler recreation
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedId) {
      // Mark as read after a short delay to ensure the user is viewing it
      const timer = setTimeout(() => {
        markAsRead(selectedId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedId, markAsRead]);

  // Listen for global typing and message events
  useEffect(() => {
    console.log('[ChatsPage] ===== SETTING UP EVENT LISTENERS =====');
    const socket = getSocket();
    console.log('[ChatsPage] Using socket instance:', socket.id, 'connected:', socket.connected);
    console.log('[ChatsPage] Socket object:', socket);
    
    const handleTypingStart = (data: { conversationId?: string; conversation_id?: string }) => {
      const convId = data?.conversationId || data?.conversation_id;
      if (convId) {
        setTypingInConversations(prev => {
          const next = new Set(prev);
          next.add(convId);
          return next;
        });
        
        // Auto-clear after 3 seconds as fallback
        setTimeout(() => {
          setTypingInConversations(prev => {
            const next = new Set(prev);
            next.delete(convId);
            return next;
          });
        }, 3500);
      }
    };
    
    const handleTypingStop = (data: { conversationId?: string; conversation_id?: string }) => {
      const convId = data?.conversationId || data?.conversation_id;
      if (convId) {
        setTypingInConversations(prev => {
          const next = new Set(prev);
          next.delete(convId);
          return next;
        });
      }
    };
    
    const handleConversationCreated = () => {
      console.log('[ChatsPage] conversation:created event received');
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    };
    
    const handleMessageNew = (eventData: Message) => {
      const convId = eventData?.conversationId || eventData?.conversation_id;
      
      if (convId) {
        queryClient.invalidateQueries({ 
          queryKey: ["chat", "conversations"]
        });
        
        // Auto-mark as read if this message is for the currently selected conversation
        if (selectedIdRef.current === convId) {
          // Small delay to ensure the message is processed first
          setTimeout(() => {
            markAsRead(convId);
          }, 100);
        }
      }
    };
    
    // Register event listeners
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('conversation:created', handleConversationCreated);
    socket.on('message:new', handleMessageNew);
    
    console.log('[ChatsPage] ✅ All event listeners registered');
    console.log('[ChatsPage] Socket listeners:', socket.listeners('message:new').length, 'for message:new');
    
    return () => {
      console.log('[ChatsPage] Cleaning up event listeners');
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('conversation:created', handleConversationCreated);
      socket.off('message:new', handleMessageNew);
    };
  }, [queryClient, markAsRead]);

  return (
    <AppLayout hideBottomNav={!!selectedId}>
      <div className={`flex ${selectedId ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-screen'}`}>
        {/* Conversations List */}
        <div className={`w-full md:w-96 border-r border-border bg-white dark:bg-[#111b21] flex-shrink-0 overflow-hidden flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          {/* WhatsApp-style Header */}
          <div className="bg-[#008069] dark:bg-[#008069] px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Chats</h1>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-[#2a3942] h-9 w-9 p-0"
                onClick={() => setShowNewConversation(true)}
                title="New Conversation"
              >
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
              <div className="animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border-b border-border dark:border-[#2a3942] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0 bg-gray-200 dark:bg-[#2a3942]" />
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-[#2a3942]" />
                        <Skeleton className="h-3 w-12 bg-gray-200 dark:bg-[#2a3942]" />
                      </div>
                      <Skeleton className="h-3 w-3/4 bg-gray-200 dark:bg-[#2a3942]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600 mb-2">Failed to load conversations</p>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })}>Retry</Button>
              </div>
            ) : data && data.length > 0 ? (
              <div>
              {data.map((c) => (
                <div key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer">
                  <ConversationItem 
                    c={c} 
                    isSelected={selectedId === c.id}
                    isTyping={typingInConversations.has(c.id)}
                  />
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
        <div className={`flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a] ${selectedId ? 'flex' : 'hidden md:flex'}`}>
          {selectedId && selectedConversation ? (
            <>
              {/* WhatsApp-style Conversation Header - Sticky */}
              <div className="sticky top-0 z-10 bg-[#f0f2f5] dark:bg-[#202c33] px-3 md:px-4 py-2 flex items-center gap-2 md:gap-3 border-b border-border dark:border-[#2a3942]">
                {/* Back button for mobile */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden h-9 w-9 p-0 shrink-0" 
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0">
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
                
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm md:text-base truncate">
                    {selectedConversation.type === 'direct' && selectedConversation.other_user
                      ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                      : selectedConversation.name || 'Conversation'}
                  </h2>
                  <p className="text-xs text-muted-foreground">online</p>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  {/* Hide video/phone on mobile */}
                  <Button variant="ghost" size="sm" className="hidden md:flex h-10 w-10 p-0">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hidden md:flex h-10 w-10 p-0">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Search className="h-5 w-5" />
                  </Button>
                  
                  {/* Hamburger menu - mobile only */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden h-9 w-9 p-0"
                    onClick={toggleMobileSidebar}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  {/* More menu - desktop only */}
                  <Button variant="ghost" size="sm" className="hidden md:flex h-9 w-9 p-0">
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

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
      />
    </AppLayout>
  );
}

// Conversation Detail Component
function ConversationDetail({ conversationId }: { conversationId: string }) {
  const { items, isLoading, error, hasMore, loadMore } = useConversationMessages(conversationId);
  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === conversationId);
  const { data: profile } = useProfile();
  const me = profile?.id ?? null;
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const { mutateAsync: send, isPending } = useSendMessage(conversationId);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mutate: markAsReadInDetail } = useMarkConversationAsRead();
  
  useChatRealtime(conversationId, {
    onMessageNew: () => {
      // Message will be added via the hook, scroll after state updates
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
      
      // Mark as read since we're viewing this conversation
      markAsReadInDetail(conversationId);
    },
    onTypingStart: (userId) => {
      if (userId !== me) {
        setTheirTyping(true);
        
        // Auto-clear after 3.5 seconds as fallback
        setTimeout(() => {
          setTheirTyping(false);
        }, 3500);
      }
    },
    onTypingStop: (userId) => {
      if (userId !== me) {
        setTheirTyping(false);
      }
    },
  });

  // Handle typing stop after user stops typing
  useEffect(() => {
    if (!isTyping) return;
    
    const timer = setTimeout(() => {
      setIsTyping(false);
      
      const socket = getSocket();
      if (socket.connected && conversationId) {
        socket.emit("typing:stop", { conversationId });
      }
    }, 2000); // Stop after 2 seconds of no typing
    
    return () => clearTimeout(timer);
  }, [isTyping, conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (items.length > 0) {
      // Use setTimeout to ensure DOM has updated
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

  // Also scroll when items array reference changes (for realtime messages)
  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items]);

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
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[#efeae2] dark:bg-[#0b141a]">
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
              <MessageItem 
                key={msg.id} 
                m={msg} 
                me={me}
                conversationType={conversation?.type}
              />
            ))}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {theirTyping && <TypingIndicator />}
            </AnimatePresence>
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer - Above mobile nav */}
      <div className="p-3 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom)+12px)] md:pb-4 bg-white dark:bg-card border-t border-border">
        <form onSubmit={onSend} className="flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              const newValue = e.target.value;
              setText(newValue);
              
              // Emit typing event DIRECTLY here
              if (!isTyping && conversationId) {
                setIsTyping(true);
                
                const socket = getSocket();
                if (socket.connected) {
                  socket.emit("typing:start", { conversationId });
                } else {
                  socket.once('connect', () => {
                    socket.emit("typing:start", { conversationId });
                  });
                }
              }
            }}
            placeholder="Type a message"
            className="flex-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !text.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

// Import required hooks
import { useConversationMessages, useSendMessage, useMarkConversationAsRead } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { useChatRealtime } from "@/domains/chat/realtime";

