"use client";

import { useParams, useRouter } from "next/navigation";
import { useConversationMessages, useSendMessage, useConversations } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { MessageItem } from "@/domains/chat/components/MessageItem";
import { UserDetailDialog } from "@/domains/chat/components/UserDetailDialog";
import { GroupDetailDialog } from "@/domains/chat/components/GroupDetailDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatRealtime } from "@/domains/chat/realtime";
import { X, Send, Paperclip, ArrowLeft, Search, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/domains/chat/types";
import { useMediaUpload } from "@/shared/hooks/useMediaUpload";
import { MediaPreview } from "@/domains/chat/components/MediaPreview";
import { TypingIndicator } from "@/domains/chat/components/TypingIndicator";
import AppLayout from "@/components/layout/AppLayout";
import { useSidebar } from "@/contexts/SidebarContext";
import { Menu } from "lucide-react";

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
  
  const { mutateAsync: send, isPending } = useSendMessage(conversationId);
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

  // realtime typing indicator and messages
  useChatRealtime(conversationId, {
    onMessageNew: (newMessage) => {
      // Message will be added via the hook, but we need to scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onTypingStart: (userId) => {
      // Only show typing if it's not me
      if (userId !== me) {
        setTypingUsers((prev) => new Set(prev).add(userId));
        setTheirTyping(true);
      }
    },
    onTypingStop: (userId) => {
      if (userId !== me) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        // Update typing state based on remaining users
        setTimeout(() => {
          setTypingUsers((current) => {
            setTheirTyping(current.size > 0);
            return current;
          });
        }, 0);
      }
    },
  });

  // emit typing events with debounce
  useEffect(() => {
    if (!isTyping || !conversationId) return;
    
    // Import socket dynamically
    import("@/core/realtime/socket").then(({ getSocket }) => {
      const socket = getSocket();
      socket.emit("typing:start", { conversationId });
      
      // Auto stop after 3 seconds
      const stopTimeout = setTimeout(() => {
        socket.emit("typing:stop", { conversationId });
        setIsTyping(false);
      }, 3000);
      
      return () => clearTimeout(stopTimeout);
    });
  }, [isTyping, conversationId]);

  // Stop typing on unmount or when user stops typing
  useEffect(() => {
    return () => {
      if (conversationId) {
        import("@/core/realtime/socket").then(({ getSocket }) => {
          const socket = getSocket();
          socket.emit("typing:stop", { conversationId });
        });
      }
    };
  }, [conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (items.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [items.length]);

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

  const handleReact = (messageId: string, emoji: string) => {
    // TODO: Implement reaction API call
    console.log("React:", messageId, emoji);
  };

  const handleDelete = (messageId: string) => {
    // TODO: Implement delete API call
    console.log("Delete:", messageId);
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
      {/* Header - Fixed */}
      <div className="px-3 md:px-4 py-3 bg-white dark:bg-[#134e3a] border-b border-border flex items-center gap-2 md:gap-3 shadow-sm">
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
      <div className="border-t bg-white dark:bg-[#134e3a] shadow-lg pb-safe">
        {/* Reply preview - WhatsApp style */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3 pb-2 bg-gray-50 dark:bg-[#1f2c33]"
            >
              <div className="flex items-start gap-2 border-l-4 border-emerald-600 pl-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {replyTo.sender?.first_name || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-0.5">
                    {replyTo.text || replyTo.content || "Media"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
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
        <form onSubmit={onSend} className="p-3 md:p-4 flex items-end gap-2">
          <input
            ref={mediaUpload.fileInputRef}
            type="file"
            multiple
            accept={mediaUpload.acceptedTypes}
            onChange={(e) => mediaUpload.handleFileSelect(e.target.files)}
            className="hidden"
          />
          
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

          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setIsTyping(true);
            }}
            placeholder="Type a message"
            className="flex-1 bg-background rounded-full"
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
        onSendMessage={(userId) => {
          // TODO: Create or navigate to DM with this user
          console.log("Send message to:", userId);
        }}
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
      </div>
    </AppLayout>
  );
}
