"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useConversations, useSendMessage, useMarkConversationAsRead, useToggleReaction, useSendMessageWithFiles, useConversationMessages } from "@/domains/chat/hooks";
import { ConversationItem } from "@/domains/chat/components/ConversationItem";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, MoreVertical, Edit, Video, Phone, ArrowLeft, Menu, X, Image as ImageIcon, File, Music, Smile, Plus, RefreshCw, Send, MessageSquare } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { useChatRealtime } from "@/domains/chat/realtime";

function ChatsPageContent() {
  const { data, isLoading, error } = useConversations();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(() => {
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
      const url = new URL(window.location.href);
      url.searchParams.delete('selected');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, selectedId]);

  // Join all conversation rooms on mount
  useEffect(() => {
    if (!data || data.length === 0) return;

    const socket = getSocket();
    data.forEach(conversation => {
      socket.emit("conversation:join", { conversationId: conversation.id });
    });

    return () => {
      data.forEach(conversation => {
        socket.emit("conversation:leave", { conversationId: conversation.id });
      });
    };
  }, [data]);

  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedId) {
      queryClient.setQueryData<Conversation[]>(["chat", "conversations"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((conv) =>
          conv.id === selectedId
            ? { ...conv, unread_count: 0 }
            : conv
        );
      });

      const timer = setTimeout(() => {
        markAsRead(selectedId);
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
        if (selectedIdRef.current === convId) {
          queryClient.setQueryData<Conversation[]>(["chat", "conversations"], (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((conv) =>
              conv.id === convId
                ? { ...conv, unread_count: 0 }
                : conv
            );
          });
          markAsRead(convId);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
          }, 500);
        } else {
          queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
        }
      }
    };

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
      <div className={`flex ${selectedId ? 'h-screen' : 'h-[calc(100vh-4rem)] md:h-screen'} overflow-hidden bg-background`}>
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-card flex-shrink-0 flex flex-col transition-all duration-300 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Messages</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setShowNewConversation(true)}
                title="New Chat"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground"
                onClick={toggleMobileSidebar}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:bg-background transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                Found an error loading conversations.
                <Button variant="link" onClick={() => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] })}>Retry</Button>
              </div>
            ) : data && data.length > 0 ? (
              <div className="divide-y divide-border/50">
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
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-muted-foreground font-medium">No conversations yet</p>
                <Button variant="link" className="text-blue-600" onClick={() => setShowNewConversation(true)}>Start a new chat</Button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-background/50 ${selectedId ? 'flex' : 'hidden md:flex'} relative overflow-hidden`}>
          {selectedId && selectedConversation ? (
            <>
              {/* Header */}
              <header className="h-16 px-4 flex items-center justify-between border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <div className="relative group cursor-pointer" onClick={() => router.push(`/conversations/${selectedId}/profile`)}>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                      <AvatarImage src={
                        (selectedConversation.type === 'direct' && selectedConversation.other_user
                          ? selectedConversation.other_user.avatar_url
                          : selectedConversation.avatar_url) || undefined
                      } />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium">
                        {(() => {
                          if (selectedConversation.type === 'direct' && selectedConversation.other_user) {
                            return `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`.charAt(0).toUpperCase();
                          }
                          return (selectedConversation.name || 'C').charAt(0).toUpperCase();
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-card"></div>
                  </div>

                  <div className="flex-1 overflow-hidden" onClick={() => router.push(`/conversations/${selectedId}/profile`)}>
                    <h2 className="font-semibold text-foreground truncate cursor-pointer hover:text-blue-600 transition-colors">
                      {selectedConversation.type === 'direct' && selectedConversation.other_user
                        ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                        : selectedConversation.name || 'Conversation'}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      Active now
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-primary">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </header>

              {/* Messages Content */}
              <div className="flex-1 relative min-h-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
                <ConversationDetail conversationId={selectedId} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50 dark:bg-background/50">
              <div className="text-center max-w-sm mx-auto">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Durusuna Chat</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Select a conversation from the sidebar to start messaging, or create a new group.
                </p>
                <Button onClick={() => setShowNewConversation(true)} className="gap-2 shadow-lg shadow-blue-500/20">
                  <Plus className="h-4 w-4" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
    uploadProgress: Record<string, number>;
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
      setTimeout(() => {
        setOptimisticMessages(prev => {
          return prev.filter(msg => {
            const allFilesComplete = Object.values(msg.uploadProgress).every(progress => progress === 100);
            return !allFilesComplete;
          });
        });
      }, 100);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);

      markAsReadInDetail(conversationId);
    },
    onTypingStart: (userId) => {
      if (userId !== me) {
        setTheirTyping(true);
        setTimeout(() => { setTheirTyping(false); }, 3500);
      }
    },
    onTypingStop: (userId) => {
      if (userId !== me) {
        setTheirTyping(false);
      }
    },
  });

  useEffect(() => {
    if (!isTyping) return;
    const timer = setTimeout(() => {
      setIsTyping(false);
      const socket = getSocket();
      if (socket.connected && conversationId) {
        socket.emit("typing:stop", { conversationId });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isTyping, conversationId]);

  useEffect(() => {
    if (items.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [items.length]);

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
      // Directly trigger file upload from drop
      handleFileUpload(files);
    }
  };

  const handleReact = useCallback((messageId: string, emoji: string) => {
    const mutateFn = reactToMessageRef.current;
    if (mutateFn && messageId) {
      mutateFn({ messageId, emoji });
    }
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
    const initialProgress: Record<string, number> = {};
    files.forEach(file => {
      const fileId = file.name + file.size;
      initialProgress[fileId] = 0;
    });

    setOptimisticMessages(prev => [...prev, {
      id: optimisticId,
      files,
      text: messageText || text.trim(),
      timestamp: new Date().toISOString(),
      uploadProgress: initialProgress,
    }]);

    if (!messageText) {
      setText("");
      setReplyTo(null);
    }

    setTimeout(() => {
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));
    }, 10000);

    return optimisticId;
  };

  const handleFileUpload = async (files: File[]) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    try {
      handleOptimisticMessage(files, undefined, optimisticId);
      await sendWithFiles({
        text: text.trim(),
        files,
        replyTo: replyTo?.id,
        onProgress: (fileIndex: number, progress: number) => {
          if (files[fileIndex]) {
            const fileId = files[fileIndex].name + files[fileIndex].size;
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
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Could not upload files.",
      });
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full min-h-0 relative ${dragActive ? 'bg-blue-50/50' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-xl m-2">
          <div className="text-center animate-bounce">
            <div className="text-4xl mb-2">📁</div>
            <p className="font-semibold text-blue-600">Drop files to share</p>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 min-h-0 pb-[80px]">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
            <p className="text-sm">Failed to load messages</p>
            <Button variant="outline" size="sm" onClick={loadMore}>Retry</Button>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center py-2">
                <Button variant="ghost" size="sm" onClick={loadMore} className="text-xs text-muted-foreground hover:text-primary">Load previous messages</Button>
              </div>
            )}

            <div className="space-y-4">
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

              {/* Optimistic Messages */}
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
            </div>

            <AnimatePresence>
              {theirTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="sticky bottom-0 pb-2"
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer Area */}
      <div className="p-3 bg-background border-t border-border z-10 w-full mb-[calc(env(safe-area-inset-bottom))]">
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="px-4 py-2 bg-muted/50 rounded-lg border border-border flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-1 h-8 bg-blue-500 rounded-full" />
                <div className="flex flex-col text-xs overflow-hidden">
                  <span className="font-semibold text-blue-600">Replying to {replyTo.sender?.first_name || 'User'}</span>
                  <span className="text-muted-foreground truncate">{replyTo.text || 'Attachment'}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="h-6 w-6 p-0 rounded-full">
                <X className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSend} className="flex items-end gap-2 bg-background p-1">
          <div className="flex items-center gap-1 pb-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-full"
              onClick={() => setShowFileUploadOptions(!showFileUploadOptions)}
            >
              <Plus className="h-5 w-5" />
            </Button>
            {showFileUploadOptions && (
              <div className="absolute bottom-16 left-4 bg-popover border border-border rounded-xl shadow-lg p-1.5 flex flex-col min-w-[180px] animate-scale-in">
                <button type="button" className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm" onClick={() => { setFileUploadType('media'); setShowFileUploadModal(true); setShowFileUploadOptions(false); }}>
                  <ImageIcon className="h-4 w-4 text-blue-500" /> Image / Video
                </button>
                <button type="button" className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm" onClick={() => { setFileUploadType('document'); setShowFileUploadModal(true); setShowFileUploadOptions(false); }}>
                  <File className="h-4 w-4 text-orange-500" /> Document
                </button>
                <button type="button" className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm" onClick={() => { setFileUploadType('audio'); setShowFileUploadModal(true); setShowFileUploadOptions(false); }}>
                  <Music className="h-4 w-4 text-purple-500" /> Audio
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 relative bg-muted/30 hover:bg-muted/50 focus-within:bg-background focus-within:ring-1 focus-within:ring-blue-500/30 rounded-2xl border border-transparent focus-within:border-blue-500/30 transition-all">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (!isTyping && conversationId) {
                  setIsTyping(true);
                  const socket = getSocket();
                  if (socket.connected) socket.emit("typing:start", { conversationId });
                }
              }}
              placeholder="Type your message..."
              className="w-full bg-transparent border-0 px-4 py-3 text-sm focus:ring-0 placeholder:text-muted-foreground h-[44px]"
              disabled={isPending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-yellow-500 hover:bg-transparent"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </Button>

            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50 shadow-xl">
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

          <Button
            type="submit"
            disabled={!text.trim() && !isUploadingFiles}
            size="icon"
            className={`h-11 w-11 rounded-full shadow-md transition-all ${text.trim() || isUploadingFiles
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-muted text-muted-foreground"
              }`}
          >
            {isUploadingFiles ? (
              <div className="h-4 w-4 animate-spin border-2 border-white/50 border-t-white rounded-full" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </form>
      </div>

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

export default function ChatsPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground animate-pulse">Loading messages...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <ChatsPageContent />
    </Suspense>
  );
}
