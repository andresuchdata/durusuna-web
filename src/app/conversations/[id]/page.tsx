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
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/domains/chat/types";

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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const { mutateAsync: send, isPending } = useSendMessage(conversationId);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find current conversation
  const conversation = conversations?.find(c => c.id === conversationId);

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    
    // TODO: Send with reply_to if replyTo is set
    await send({ text });
    setText("");
    setReplyTo(null);
    inputRef.current?.focus();
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

  const handleGroupAvatarClick = () => {
    if (conversation?.type === "group") {
      setShowGroupDialog(true);
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
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="px-4 py-3 bg-white dark:bg-[#134e3a] border-b border-border flex items-center gap-3 shadow-sm">
        <button 
          onClick={handleHeaderAvatarClick}
          className="hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={headerAvatar} alt={headerName} />
            <AvatarFallback className="bg-emerald-600 text-white text-sm">
              {headerInitials}
            </AvatarFallback>
          </Avatar>
        </button>
        
        <div className="flex-1 min-w-0">
          <button 
            onClick={handleHeaderAvatarClick}
            className="font-semibold text-lg hover:underline text-left truncate block w-full"
          >
            {headerName}
          </button>
          {theirTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-emerald-600"
            >
              typing…
            </motion.div>
          )}
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
            </div>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer - Fixed */}
      <div className="border-t bg-white dark:bg-[#134e3a] shadow-lg">
        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3 border-l-4 border-emerald-600 bg-gray-50 dark:bg-[#1f2c33]"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-emerald-600">
                    Replying to {replyTo.sender?.first_name || "Unknown"}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {replyTo.text || replyTo.content}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={onSend} className="p-3 md:p-4 flex gap-2">
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
          <Button 
            type="submit" 
            disabled={isPending || !text.trim()} 
            className="bg-emerald-600 hover:bg-emerald-700"
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
  );
}
