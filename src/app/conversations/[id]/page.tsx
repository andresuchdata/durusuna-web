"use client";

import { useParams, useRouter } from "next/navigation";
import { useConversationMessages, useSendMessage, useConversations, useToggleReaction, useDeleteMessage, useForwardMessage } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { UserDetailDialog } from "@/domains/chat/components/UserDetailDialog";
import { GroupDetailDialog } from "@/domains/chat/components/GroupDetailDialog";
import { ForwardMessageDialog } from "@/domains/chat/components/ForwardMessageDialog";
import { EmojiPickerComponent } from "@/domains/chat/components/EmojiPicker";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useChatRealtime } from "@/domains/chat/realtime";
import { X, Send, Paperclip, ArrowLeft, Search, MoreVertical, Image as ImageIcon, File, Video, Music, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/domains/chat/types";
import { useMediaUpload } from "@/shared/hooks/useMediaUpload";
import { MediaPreview } from "@/domains/chat/components/MediaPreview";
import { TypingIndicator } from "@/domains/chat/components/TypingIndicator";
import AppLayout from "@/components/layout/AppLayout";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu } from "lucide-react";
import { getSocket } from "@/core/realtime/socket";

export default function ChatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const conversationId = params?.id;
  const { items, isLoading, error, hasMore, loadMore } = useConversationMessages(conversationId);
  const { data: conversations } = useConversations();
  const { data: profile } = useProfile();
  const me = profile?.id ?? null;

  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [theirTyping, setTheirTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Only initialize hooks when conversationId is available
  const { mutateAsync: send, isPending } = useSendMessage(conversationId || '');
  const toggleReactionMutation = useToggleReaction(conversationId || '');
  const { mutate: deleteMsg } = useDeleteMessage(conversationId || '');
  const { mutate: forwardMsg, isPending: isForwarding } = useForwardMessage();
  
  // Get reactToMessage from mutation object - ensure it's always available
  const reactToMessage = toggleReactionMutation?.mutate;
  
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toggleMobileSidebar } = useSidebar();

  // Media upload
  const mediaUpload = useMediaUpload({
    maxFiles: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    entityId: conversationId,
    uploadEndpoint: '/conversations/generate-presigned-urls',
  });

  // Find current conversation
  const conversation = conversations?.find(c => c.id === conversationId);

  // Memoize realtime handlers to prevent re-subscribing
  const handleMessageNew = useCallback(() => {
    // Message will be added via the hook, scroll after state updates
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }, []);

  const handleTypingStart = useCallback((userId: string) => {
    // Only show typing if it's not me
    if (userId !== me) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev).add(userId);
        return newSet;
      });
      setTheirTyping(true);
    }
  }, [me]);

  const handleTypingStop = useCallback((userId: string) => {
    if (userId !== me) {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      // Update typing state based on remaining users
      setTimeout(() => {
        setTypingUsers((current) => {
          const stillTyping = current.size > 0;
          setTheirTyping(stillTyping);
          return current;
        });
      }, 0);
    }
  }, [me]);

  // realtime typing indicator and messages
  useChatRealtime(conversationId, {
    onMessageNew: handleMessageNew,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
  });

  // Debug: Log isTyping state changes
  useEffect(() => {
  }, [isTyping]);

  // Debug: Test socket on mount
  useEffect(() => {
    if (!conversationId) return;
    
    const socket = getSocket();
    
    // Test emit after 2 seconds
    setTimeout(() => {
      socket.emit("typing:start", { conversationId });
    }, 2000);
  }, [conversationId]);

  // emit typing events with debounce
  useEffect(() => {
    if (!isTyping || !conversationId) {
      return;
    }
    
    // Import socket dynamically
    import("@/core/realtime/socket").then(({ getSocket }) => {
      const socket = getSocket();

      const emitTypingStart = () => {
        socket.emit("typing:start", { conversationId });
      };
      
      if (socket.connected) {
        emitTypingStart();
      } else {
        socket.once('connect', emitTypingStart);
      }
      
      // Auto stop after 3 seconds
      const stopTimeout = setTimeout(() => {
        if (socket.connected) {
          socket.emit("typing:stop", { conversationId });
        }
        setIsTyping(false);
      }, 3000);
      
      return () => {
        clearTimeout(stopTimeout);
        socket.off('connect', emitTypingStart);
      };
    });
  }, [isTyping, conversationId]);

  // Stop typing on unmount or when user stops typing
  useEffect(() => {
    return () => {
      if (conversationId) {
        import("@/core/realtime/socket").then(({ getSocket }) => {
          const socket = getSocket();
          if (socket.connected) {
            socket.emit("typing:stop", { conversationId });
          }
        });
      }
    };
  }, [conversationId]);

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
    if (!text.trim() && mediaUpload.mediaFiles.length === 0) return;
    
    try {
      // Upload media files first if any
      let attachments: Array<{ id: string; url: string; type: string; name: string; size: number }> = [];
      if (mediaUpload.mediaFiles.length > 0) {
        const uploaded = await mediaUpload.uploadFiles();
        attachments = uploaded.map((att) => ({
          id: att.id,
          url: att.url,
          type: att.mimeType,
          name: att.originalName,
          size: att.size,
        }));
      }

      // Send message with attachments and reply_to
      await send({ 
        text: text.trim() || ' ', // Space if no text but has media
        replyTo: replyTo?.id,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      
      setText("");
      setReplyTo(null);
      mediaUpload.reset();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  // Use ref to store the latest reactToMessage to avoid closure issues
  const reactToMessageRef = useRef(reactToMessage);
  useEffect(() => {
    reactToMessageRef.current = reactToMessage;
  }, [reactToMessage]);
  
  // Define handleReact with stable reference - always defined
  const handleReact = useCallback((messageId: string, emoji: string) => {
    const currentReactToMessage = reactToMessageRef.current;
    
    if (!messageId) {
      console.error('Message ID is missing in handleReact');
      return;
    }
    if (!conversationId) {
      console.error('Conversation ID is missing in handleReact:', conversationId);
      return;
    }
    if (!currentReactToMessage) {
      console.error('reactToMessage function is not defined!', currentReactToMessage);
      return;
    }
    try {
      currentReactToMessage({ messageId, emoji }, {
        onSuccess: (data) => {
          console.log('Reaction success:', data);
        },
        onError: (error) => {
          console.error('Reaction error:', error);
        },
      });
    } catch (error) {
      console.error('Error calling reactToMessage:', error);
    }
  }, [conversationId]); // Only depend on conversationId, not reactToMessage

  const handleDelete = (messageId: string) => {
    deleteMsg(messageId);
  };

  const handleForward = (messageId: string) => {
    setForwardMessageId(messageId);
    setShowForwardDialog(true);
  };

  const handleForwardConfirm = (targetConversationId: string) => {
    if (forwardMessageId) {
      forwardMsg(
        { messageId: forwardMessageId, targetConversationId },
        {
          onSuccess: () => {
            setShowForwardDialog(false);
            setForwardMessageId(null);
          },
        }
      );
    }
  };

  const handleAvatarClick = (userId: string) => {
    if (conversation?.type === "direct") {
      setSelectedUserId(userId);
      setShowUserDialog(true);
    }
  };

  const handleHeaderAvatarClick = () => {
    if (conversation?.type === "group") {
      setShowGroupDialog(true);
    } else if (conversation?.other_user) {
      setSelectedUserId(conversation.other_user.id);
      setShowUserDialog(true);
    }
  };

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    
    // Check if it's the other user in direct chat
    if (conversation?.other_user?.id === selectedUserId) {
      return conversation.other_user;
    }
    
    // Check participants in group
    return conversation?.participants?.find(p => p.id === selectedUserId) || null;
  }, [selectedUserId, conversation]);

  // Header display name and avatar
  const headerName = conversation?.type === "group" 
    ? (conversation.name || "Group Chat")
    : conversation?.other_user 
      ? `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
      : "Conversation";

  const headerAvatar = (conversation?.type === "group" 
    ? conversation.avatar_url 
    : conversation?.other_user?.avatar_url) || undefined;

  const headerInitials = conversation?.type === "group"
    ? (conversation.name?.split(" ").slice(0, 2).map(w => w[0]).join("") || "G")
    : conversation?.other_user
      ? `${conversation.other_user.first_name[0]}${conversation.other_user.last_name[0]}`
      : "?";

  // Get typing text for display
  const typingText = useMemo(() => {
    if (!theirTyping || typingUsers.size === 0) return null;
    
    const getTypingUserName = (userId: string): string => {
      if (conversation?.type === 'direct' && conversation?.other_user?.id === userId) {
        return conversation.other_user.first_name;
      }
      if (conversation?.type === 'group' && conversation?.participants) {
        const participant = conversation.participants.find(p => p.id === userId);
        return participant?.first_name || 'Someone';
      }
      return 'Someone';
    };
    
    if (conversation?.type === 'group') {
      const names = Array.from(typingUsers).map(getTypingUserName);
      if (names.length === 1) {
        return `${names[0]} is typing`;
      } else if (names.length === 2) {
        return `${names[0]} and ${names[1]} are typing`;
      } else {
        return `${names.length} people are typing`;
      }
    }
    return 'typing';
  }, [theirTyping, typingUsers, conversation]);

  // Create type-safe group object for dialog
  const groupForDialog = conversation?.type === "group" && conversation.name 
    ? {
        id: conversation.id,
        name: conversation.name,
        description: conversation.description ?? undefined,
        avatar_url: conversation.avatar_url ?? undefined,
        participants: conversation.participants,
        created_at: conversation.created_at
      }
    : null;

  return (
    <AppLayout hideBottomNav>
      <div className="flex flex-col h-screen">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 px-3 md:px-4 py-3 bg-white dark:bg-[#134e3a] border-b border-border flex items-center gap-2 md:gap-3 shadow-sm">
        {/* Back button - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/conversations')}
          className="md:hidden h-9 w-9 p-0 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <button 
          onClick={handleHeaderAvatarClick}
          className="hover:opacity-80 transition-opacity shrink-0"
        >
          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            <AvatarImage src={headerAvatar} alt={headerName} />
            <AvatarFallback className="bg-emerald-600 text-white text-xs md:text-sm">
              {headerInitials}
            </AvatarFallback>
          </Avatar>
        </button>
        
        <div className="flex-1 min-w-0">
          <button 
            onClick={handleHeaderAvatarClick}
            className="font-semibold text-sm md:text-lg hover:underline text-left truncate block w-full"
          >
            {headerName}
          </button>
          {theirTyping ? (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>{typingText}</span>
              <span className="flex gap-0.5">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                >
                  •
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                >
                  •
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                >
                  •
                </motion.span>
              </span>
            </motion.div>
          ) : (
            <span className="text-xs text-muted-foreground">online</span>
          )}
        </div>

        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 p-0 shrink-0"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Hamburger menu - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileSidebar}
          className="md:hidden h-9 w-9 p-0 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* More menu - desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-9 w-9 p-0 shrink-0"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[#efeae2] dark:bg-[#0a3622] pb-safe">
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
            <div className="space-y-4">
              {items.map((m) => (
                <MessageItem 
                  key={m.id || m.serverId} 
                  m={m} 
                  me={me}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  onForward={handleForward}
                  onAvatarClick={handleAvatarClick}
                />
              ))}
              
              {/* Typing indicator in message list */}
              <AnimatePresence>
                {theirTyping && <TypingIndicator />}
              </AnimatePresence>
            </div>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer - Fixed, above mobile nav */}
      <div className="border-t bg-white dark:bg-[#134e3a] shadow-lg pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-0">
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

        {/* Media preview - WhatsApp style */}
        <AnimatePresence>
          {mediaUpload.mediaFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2"
            >
              <MediaPreview
                mediaFiles={mediaUpload.mediaFiles}
                onRemove={mediaUpload.removeMediaFile}
                variant="compact"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {mediaUpload.errors.upload && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20">
            <p className="text-xs text-red-600 dark:text-red-400">{mediaUpload.errors.upload}</p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={onSend} className="p-3 md:p-4 flex items-end gap-2 relative">
          <input
            ref={mediaUpload.fileInputRef}
            type="file"
            multiple
            accept={mediaUpload.acceptedTypes}
            onChange={(e) => mediaUpload.handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          {/* Emoji Button - Leftmost */}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="shrink-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <EmojiPickerComponent
                  onSelectEmoji={(emoji) => {
                    setText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                  position="bottom"
                />
              )}
            </AnimatePresence>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => mediaUpload.fileInputRef.current?.click()}
            disabled={!mediaUpload.canAddMore || mediaUpload.isUploading}
            className="shrink-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              const newValue = e.target.value;
              setText(newValue);
              
              // Emit typing event DIRECTLY here instead of relying on useEffect
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
            onFocus={() => setShowEmojiPicker(false)}
            placeholder="Type a message"
            className="flex-1 bg-background rounded-full px-4 py-2 border border-input focus:outline-none focus:ring-2 focus:ring-emerald-600"
            disabled={mediaUpload.isUploading}
          />

          <Button 
            type="submit" 
            disabled={isPending || mediaUpload.isUploading || (!text.trim() && mediaUpload.mediaFiles.length === 0)} 
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Dialogs */}
      <UserDetailDialog
        open={showUserDialog}
        onClose={() => {
          setShowUserDialog(false);
          setSelectedUserId(null);
        }}
        user={selectedUser}
      />

      <GroupDetailDialog
        open={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
        group={groupForDialog}
        onViewParticipant={(userId) => {
          setSelectedUserId(userId);
          setShowUserDialog(true);
        }}
      />

      <ForwardMessageDialog
        open={showForwardDialog}
        onOpenChange={setShowForwardDialog}
        conversations={conversations?.filter(c => c.id !== conversationId) || []}
        onForward={handleForwardConfirm}
        isForwarding={isForwarding}
      />
      </div>
    </AppLayout>
  );
}
