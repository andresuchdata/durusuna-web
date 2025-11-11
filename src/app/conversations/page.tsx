"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useConversations } from "@/domains/chat/hooks";
import { ConversationItem } from "@/domains/chat/components/ConversationItem";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, Edit, Video, Phone, ArrowLeft, Menu, X, Image as ImageIcon, File, Music, Smile, Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/contexts/SidebarContext";
import { getSocket } from "@/core/realtime/socket";
import { Message, Conversation } from "@/domains/chat/types";
import { NewConversationDialog } from "@/components/conversations/NewConversationDialog";
import { TypingIndicator } from "@/domains/chat/components/TypingIndicator";
import { EmojiPickerComponent } from "@/domains/chat/components/EmojiPicker";
import { FileUploadModal } from "@/domains/chat/components/FileUploadModal";
import { OptimisticMessage } from "@/domains/chat/components/OptimisticMessage";
import { AnimatePresence, motion } from "framer-motion";

function ChatsPageContent() {
  const { data, isLoading, error } = useConversations();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize selectedId from URL parameter or null
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    // Only read from URL on initial render
    return searchParams.get('selected');
  });
  
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [typingInConversations, setTypingInConversations] = useState<Set<string>>(new Set());
  const selectedConversation = data?.find(c => c.id === selectedId);
  const { toggleMobileSidebar } = useSidebar();
  const { mutate: markAsRead } = useMarkConversationAsRead();

  // Clear URL parameter when conversation is selected from URL
  useEffect(() => {
    const selectedFromUrl = searchParams.get('selected');
    if (selectedFromUrl && selectedId === selectedFromUrl) {
      // Clear the URL parameter after the component has mounted with the selection
      const url = new URL(window.location.href);
      url.searchParams.delete('selected');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, selectedId]);

  // Join all conversation rooms on mount
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const socket = getSocket();
    
    // Join all conversation rooms to receive events
    data.forEach(conversation => {
      socket.emit("conversation:join", { conversationId: conversation.id });
    });
    
    return () => {
      // Leave all rooms on unmount
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
      // Optimistically update unread count to 0
      queryClient.setQueryData<Conversation[]>(["chat", "conversations"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((conv) =>
          conv.id === selectedId
            ? { ...conv, unread_count: 0 }
            : conv
        );
      });
      
      // Mark as read after a short delay to ensure the user is viewing it
      const timer = setTimeout(() => {
        markAsRead(selectedId);
        
        // Refetch after giving backend time to process
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
        }, 500);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedId, markAsRead, queryClient]);

  // Listen for global typing and message events
  useEffect(() => {
    const socket = getSocket();
    
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
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    };
    
    const handleMessageNew = (eventData: Message) => {
      const convId = eventData?.conversationId || eventData?.conversation_id;
      
      if (convId) {
        // Auto-mark as read if this message is for the currently selected conversation
        if (selectedIdRef.current === convId) {
          // Optimistically update unread count to 0 immediately
          queryClient.setQueryData<Conversation[]>(["chat", "conversations"], (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((conv) =>
              conv.id === convId
                ? { ...conv, unread_count: 0 }
                : conv
            );
          });
          
          // Then mark as read on backend
          markAsRead(convId);
          
          // Delay refetch to allow backend to process mark-as-read
          setTimeout(() => {
            queryClient.invalidateQueries({ 
              queryKey: ["chat", "conversations"]
            });
          }, 500);
        } else {
          // For non-active conversations, refetch immediately
          queryClient.invalidateQueries({ 
            queryKey: ["chat", "conversations"]
          });
        }
      }
    };
    
    // Register event listeners
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('conversation:created', handleConversationCreated);
    socket.on('message:new', handleMessageNew);
    
    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('conversation:created', handleConversationCreated);
      socket.off('message:new', handleMessageNew);
    };
  }, [queryClient, markAsRead]);

  return (
    <AppLayout hideBottomNav={!!selectedId}>
      <div className={`flex ${selectedId ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-screen'} overflow-x-hidden`}>
        {/* Conversations List */}
        <div className={`w-full md:w-96 border-r border-border bg-white dark:bg-[#111b21] flex-shrink-0 overflow-hidden flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          {/* WhatsApp-style Header - Hidden on mobile when conversation selected, always visible on desktop */}
          <div className={`bg-[#008069] dark:bg-[#008069] px-4 py-3 flex items-center justify-between ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-[#2a3942] h-9 w-9 p-0 md:hidden"
                onClick={toggleMobileSidebar}
                title="Toggle Sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-white">Chats</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-[#2a3942] h-9 w-9 p-0"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })}
                title="Refresh Conversations"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
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
          
          {/* Search Bar - Hidden on mobile when conversation selected, always visible on desktop */}
          <div className={`p-2 bg-white dark:bg-[#111b21] ${selectedId ? 'hidden md:block' : 'block'}`}>
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
                <ConversationItem 
                  key={c.id}
                  c={c} 
                  isSelected={selectedId === c.id}
                  isTyping={typingInConversations.has(c.id)}
                  onSelect={() => setSelectedId(c.id)}
                />
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
        <div className={`flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a] ${selectedId ? 'flex' : 'hidden md:flex'} overflow-x-hidden min-h-0`}>
          {selectedId && selectedConversation ? (
            <>
              {/* WhatsApp-style Conversation Header - Sticky */}
              <div className="sticky top-0 z-10 bg-[#f0f2f5] dark:bg-[#202c33] px-3 md:px-4 py-2 flex items-center gap-2 md:gap-3 border-b border-border dark:border-[#2a3942] overflow-hidden w-full max-w-full">
                {/* Back button for mobile */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden h-9 w-9 p-0 shrink-0" 
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <button 
                  onClick={() => router.push(`/conversations/${selectedId}/profile`)}
                  className="shrink-0 hover:opacity-80 transition-opacity"
                >
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
                </button>
                
                <button 
                  onClick={() => router.push(`/conversations/${selectedId}/profile`)}
                  className="flex-1 min-w-0 max-w-full overflow-hidden pr-2 text-left hover:opacity-80 transition-opacity"
                >
                  <h2 className="font-semibold text-sm md:text-base truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-full block">
                    {selectedConversation.type === 'direct' && selectedConversation.other_user
                      ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                      : selectedConversation.name || 'Conversation'}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-full block">online</p>
                </button>
                
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  {/* Hide video/phone on mobile */}
                  <Button variant="ghost" size="sm" className="hidden md:flex h-10 w-10 p-0 shrink-0">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hidden md:flex h-10 w-10 p-0 shrink-0">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0">
                    <Search className="h-5 w-5" />
                  </Button>
                  
                  {/* Hamburger menu - mobile only */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="md:hidden h-9 w-9 p-0 shrink-0"
                    onClick={toggleMobileSidebar}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  {/* More menu - desktop only */}
                  <Button variant="ghost" size="sm" className="hidden md:flex h-9 w-9 p-0 shrink-0">
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
  const { toast } = useToast();
  const { items, isLoading, error, hasMore, loadMore } = useConversationMessages(conversationId);
  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === conversationId);
  const { data: profile } = useProfile();
  const me = profile?.id ?? null;
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUploadOptions, setShowFileUploadOptions] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [fileUploadType, setFileUploadType] = useState<'image' | 'video' | 'audio' | 'document' | 'media' | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Array<{
    id: string;
    files: File[];
    text?: string;
    timestamp: string;
    uploadProgress: Record<string, number>; // fileId -> progress percentage
  }>>([]);
  const { mutateAsync: send, isPending } = useSendMessage(conversationId);
  const { mutateAsync: sendWithFiles, isPending: isUploadingFiles } = useSendMessageWithFiles(conversationId);
  const toggleReactionMutation = useToggleReaction(conversationId);
  const reactToMessage = toggleReactionMutation?.mutate;
  const reactToMessageRef = useRef(reactToMessage);
  useEffect(() => {
    reactToMessageRef.current = reactToMessage;
  }, [reactToMessage]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const { mutate: markAsReadInDetail } = useMarkConversationAsRead();
  
  useChatRealtime(conversationId, {
    onMessageNew: () => {
      // Clear any remaining optimistic messages when real message arrives
      // This prevents gap between optimistic completion and real message appearance
      setTimeout(() => {
        setOptimisticMessages(prev => {
          // Only clear optimistic messages that are fully uploaded (100% progress)
          return prev.filter(msg => {
            const allFilesComplete = Object.values(msg.uploadProgress).every(progress => progress === 100);
            return !allFilesComplete; // Keep messages that aren't fully uploaded yet
          });
        });
      }, 100); // Small delay to ensure real message is in DOM first
      
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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    const mutateFn = reactToMessageRef.current;
    if (!mutateFn) {
      console.error("reactToMessage mutation is not available");
      return;
    }
    if (!messageId) {
      console.error("Message ID is missing for reaction");
      return;
    }
    mutateFn({ messageId, emoji });
  }, []);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await send({ 
      text: text.trim(),
      replyTo: replyTo?.id 
    });
    setText("");
    setReplyTo(null);
    inputRef.current?.focus();
  }

  const handleOptimisticMessage = (files: File[], messageText?: string, customOptimisticId?: string) => {
    const optimisticId = customOptimisticId || `optimistic-${Date.now()}-${Math.random()}`;
    
    // Initialize progress for all files
    const initialProgress: Record<string, number> = {};
    files.forEach(file => {
      const fileId = file.name + file.size;
      initialProgress[fileId] = 0;
    });
    
    const newOptimisticMessage = {
      id: optimisticId,
      files,
      text: messageText || text.trim(),
      timestamp: new Date().toISOString(),
      uploadProgress: initialProgress,
    };
    
    setOptimisticMessages(prev => [...prev, newOptimisticMessage]);
    setText("");
    setReplyTo(null);
    
    // Remove optimistic message after successful upload (or error)
    // This will be handled by the actual message arrival via real-time
    setTimeout(() => {
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    }, 10000); // Remove after 10 seconds as fallback
    
    return optimisticId;
  };

  const handleFileUpload = async (files: File[]) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    
    try {
      // Create optimistic message with initial progress
      handleOptimisticMessage(files, undefined, optimisticId);
      
      await sendWithFiles({
        text: text.trim(),
        files,
        replyTo: replyTo?.id,
        onProgress: (fileIndex: number, progress: number) => {
          if (files[fileIndex]) {
            const fileId = files[fileIndex].name + files[fileIndex].size;
            
            // Update optimistic message with progress (single source of truth)
            setOptimisticMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === optimisticId 
                  ? { ...msg, uploadProgress: { ...msg.uploadProgress, [fileId]: progress } }
                  : msg
              )
            );
          }
        },
        onFileComplete: (fileIndex: number) => {
          if (files[fileIndex]) {
            const fileId = files[fileIndex].name + files[fileIndex].size;
            
            // Mark file as complete (100%) in optimistic message
            setOptimisticMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === optimisticId 
                  ? { ...msg, uploadProgress: { ...msg.uploadProgress, [fileId]: 100 } }
                  : msg
              )
            );
          }
        }
      });
      
    } catch (error: unknown) {
      console.error('Failed to send message with files:', error);
      
      // Remove the optimistic message on error since upload failed
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      
      // Show detailed error message
      let errorMessage = "Failed to send message with files. Please try again.";
      
      const err = error as { response?: { data?: { details?: unknown; message?: string } }; message?: string };
      if (err?.response?.data?.details) {
        // Handle validation errors from backend
        const details = err.response.data.details;
        if (Array.isArray(details)) {
          errorMessage = details.map((d: { message?: string }) => d.message || 'Unknown error').join(', ');
        }
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: errorMessage,
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full w-full min-h-0 ${dragActive ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {dragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 border-2 border-dashed border-blue-500">
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">Drop files here to send</p>
            <p className="text-sm text-blue-500">Release to upload files to this conversation</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[#efeae2] dark:bg-[#0b141a] min-h-0 pb-[80px]">
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
                onReply={setReplyTo}
                onReact={handleReact}
                conversationType={conversation?.type}
              />
            ))}
            
            {/* Optimistic messages */}
            {optimisticMessages.map((optimisticMsg) => (
              <OptimisticMessage
                key={optimisticMsg.id}
                text={optimisticMsg.text}
                files={optimisticMsg.files}
                sender={{
                  id: me || '',
                  first_name: profile?.first_name || 'You',
                  last_name: profile?.last_name || '',
                  avatar_url: profile?.avatar_url || undefined,
                }}
                conversationType={conversation?.type}
                uploadProgress={optimisticMsg.uploadProgress}
                me={me || undefined}
              />
            ))}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {theirTyping && <div className="mb-8"><TypingIndicator /></div>}
            </AnimatePresence>
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer - Above mobile nav */}
      <div className="pb-[calc(0.75rem+env(safe-area-inset-bottom)+12px)] md:pb-4 bg-white dark:bg-card border-t border-border">
        {/* Reply preview - WhatsApp style */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pt-2.5 pb-2 bg-[#e5ddd5] dark:bg-[#1f2c33] border-b border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-2">
                {/* Colored vertical bar */}
                <div className="w-1 h-10 bg-emerald-600 rounded-full shrink-0 mt-0.5" />
                
                {/* Message content */}
                <div className="flex-1 min-w-0 py-0.5 overflow-hidden">
                  {/* "Replying to [Name]" label */}
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Replying to
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">
                      {replyTo.sender 
                        ? `${replyTo.sender.first_name} ${replyTo.sender.last_name}`
                        : "Unknown"}
                    </span>
                  </div>
                  
                  {/* Message preview */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* Media/File indicator */}
                    {replyTo.attachments && replyTo.attachments.length > 0 ? (
                      <>
                        {replyTo.attachments[0].type?.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" />
                        ) : replyTo.attachments[0].type?.startsWith('video/') ? (
                          <Video className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" />
                        ) : replyTo.attachments[0].type?.startsWith('audio/') ? (
                          <Music className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" />
                        ) : (
                          <File className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" />
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400 italic truncate">
                          {replyTo.attachments[0].type?.startsWith('image/') ? 'Photo' :
                           replyTo.attachments[0].type?.startsWith('video/') ? 'Video' :
                           replyTo.attachments[0].type?.startsWith('audio/') ? 'Audio' :
                           'File'}
                        </span>
                      </>
                    ) : (
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                        {replyTo.text || replyTo.content || "Message"}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="h-6 w-6 p-0 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full shrink-0 mt-0.5"
                >
                  <X className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSend} className="p-3 md:p-4 flex gap-2 relative">
          <div className="flex-1 relative">
            {/* File Upload Button - Left Side */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUploadOptions(!showFileUploadOptions)}
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 z-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
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
              className="h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-10 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isPending}
            />

            {/* Emoji Picker Button - Right Side */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 z-10"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            {/* File Upload Options */}
            {showFileUploadOptions && (
              <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-[#2a3942] border border-border rounded-lg shadow-xl py-2 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => {
                    setShowFileUploadOptions(false);
                    setFileUploadType('media');
                    setShowFileUploadModal(true);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3a4a52] flex items-center gap-3"
                >
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  <span>Add Image/Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFileUploadOptions(false);
                    setFileUploadType('audio');
                    setShowFileUploadModal(true);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3a4a52] flex items-center gap-3"
                >
                  <Music className="h-5 w-5 text-green-500" />
                  <span>Add Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFileUploadOptions(false);
                    setFileUploadType('document');
                    setShowFileUploadModal(true);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#3a4a52] flex items-center gap-3"
                >
                  <File className="h-5 w-5 text-purple-500" />
                  <span>Add Document</span>
                </button>
              </div>
            )}

            {/* Emoji Picker with proper z-index */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full mb-2 right-0 z-50">
                <EmojiPickerComponent
                  onSelectEmoji={(emoji) => {
                    setText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                  position="top"
                />
              </div>
            )}
          </div>
          <Button type="submit" disabled={(isPending && !isUploadingFiles) || (!text.trim() && !isUploadingFiles)} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            {isUploadingFiles ? 'Uploading...' : isPending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        open={showFileUploadModal}
        onClose={() => {
          setShowFileUploadModal(false);
          setFileUploadType(null);
        }}
        onUpload={handleFileUpload}
        conversationId={conversationId}
        fileType={fileUploadType}
      />
    </div>
  );
}

// Import required hooks
import { useToast } from "@/components/ui/use-toast";
import { useConversationMessages, useSendMessage, useMarkConversationAsRead, useToggleReaction, useSendMessageWithFiles } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { useChatRealtime } from "@/domains/chat/realtime";

// Wrapper component with Suspense boundary
export default function ChatsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <ChatsPageContent />
    </Suspense>
  );
}

