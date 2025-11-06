"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "../types";
import { Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { MessageActions } from "./MessageActions";
import { ReactionPicker } from "./ReactionPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaThumbnailGrid, MediaViewer } from "@/components/media/MediaViewer";
import type { MediaItem } from "@/components/media/MediaViewer";

interface MessageItemProps {
  m: Message;
  me: string | null;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onForward?: (messageId: string) => void;
  onAvatarClick?: (userId: string) => void;
  conversationType?: "direct" | "group";
}

export function MessageItem({ m, me, onReply, onDelete, onReact, onForward, onAvatarClick, conversationType = "group" }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  
  const senderId = m.sender_id || m.senderId || m.sender?.id;
  const isMine = senderId === me;
  const messageText = m.text || m.content || '';
  const timestamp = m.created_at || m.createdAt || new Date().toISOString();
  
  const senderName = m.sender 
    ? `${m.sender.first_name} ${m.sender.last_name}`
    : "Unknown";
  
  const senderInitials = m.sender
    ? `${m.sender.first_name[0]}${m.sender.last_name[0]}`
    : "?";

  // Transform attachments to MediaItem format
  const mediaItems: MediaItem[] = (m.attachments || []).map((att) => ({
    id: att.id,
    name: att.type?.split('/').pop() || 'file',
    url: att.url,
    type: att.type,
  }));

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setShowActions(false);
  };

  const handleReaction = (emoji: string) => {
    onReact?.(m.id, emoji);
    setShowReactionPicker(false);
  };

  // Count reactions - handle both formats:
  // Backend format: { emoji: { count: number, users: string[] } }
  // Frontend format: { emoji: string[] } (array of user IDs)
  const reactionCounts = m.reactions
    ? Object.entries(m.reactions).map(([emoji, reactionData]) => {
        // Check if it's backend format (object with count and users)
        if (reactionData && typeof reactionData === 'object' && !Array.isArray(reactionData) && 'users' in reactionData && 'count' in reactionData) {
          const backendFormat = reactionData as { count: number; users: string[] };
          return {
            emoji,
            count: backendFormat.count || backendFormat.users?.length || 0,
            hasReacted: backendFormat.users?.includes(me || "") || false
          };
        }
        // Frontend format (array of user IDs)
        const userIds = Array.isArray(reactionData) ? reactionData : [];
        return {
          emoji,
          count: userIds.length,
          hasReacted: userIds.includes(me || "")
        };
      })
    : [];

  const totalReactions = reactionCounts.reduce((sum, r) => sum + r.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} group`}
      data-message-id={m.id}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar for others' messages (only in group chats) */}
      {!isMine && conversationType === "group" && (
        <Avatar 
          className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity mt-1" 
          onClick={() => onAvatarClick?.(senderId || "")}
        >
          <AvatarImage src={m.sender?.avatar_url} alt={senderName} />
          <AvatarFallback className="bg-emerald-600 text-white text-xs">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%] w-full`}>
        {/* Sender name for others' messages (only in group chats) */}
        {!isMine && conversationType === "group" && (
          <span className="text-xs text-muted-foreground mb-0.5 px-2">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div className="relative w-full max-w-full">
          {/* Main message */}
          <div
            className={`rounded-2xl shadow-sm w-full max-w-full ${
              isMine
                ? "bg-emerald-100 text-gray-900 rounded-br-sm"
                : "bg-white dark:bg-[#134e3a] text-foreground dark:text-white rounded-bl-sm"
            } ${messageText ? 'px-4 py-2' : mediaItems.length > 0 ? 'p-2' : 'px-4 py-2'}`}
          >
            {/* Reply indicator - WhatsApp style - INSIDE the bubble */}
            {m.reply_to && (
              <div 
                className={`flex items-start gap-2 px-2.5 mx-[-0.5rem] py-1.5 mb-2 rounded-md w-[100% + .5rem] ${
                  isMine 
                    ? "bg-emerald-400/40 border-l-4 border-emerald-700" 
                    : "bg-gray-100 dark:bg-[#1f2c33] border-l-4 border-emerald-600"
                } cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => {
                  // TODO: Scroll to original message
                  const originalMessage = document.querySelector(`[data-message-id="${m.reply_to?.id}"]`);
                  if (originalMessage) {
                    originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the message briefly
                    originalMessage.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
                    setTimeout(() => {
                      originalMessage.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2');
                    }, 2000);
                  }
                }}
              >
                {/* Reply content */}
                <div className="flex-1 min-w-0 w-full overflow-hidden">
                  <div className={`text-xs font-semibold mb-0.5 truncate ${
                    isMine 
                      ? "text-emerald-900" 
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {m.reply_to.sender_name}
                  </div>
                  <div className={`text-xs line-clamp-2 ${
                    isMine 
                      ? "text-gray-800" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {m.reply_to.content || "Media"}
                  </div>
                </div>
              </div>
            )}
            {/* Media attachments */}
            {mediaItems.length > 0 && (
              <div className="mb-2">
                <MediaThumbnailGrid
                  items={mediaItems}
                  onItemClick={(index) => {
                    setMediaViewerIndex(index);
                    setMediaViewerOpen(true);
                  }}
                />
              </div>
            )}

            {messageText && (
              <p className="text-sm break-words whitespace-pre-wrap">{messageText}</p>
            )}
            
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-muted-foreground">
                {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isMine && m.status && (
                <span className="text-emerald-600">
                  {m.status === 'read' ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : m.status === 'delivered' ? (
                    <CheckCheck className="h-3 w-3 opacity-60" />
                  ) : (
                    <Check className="h-3 w-3 opacity-60" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Reactions display */}
          {totalReactions > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -bottom-3 ${isMine ? "right-2" : "left-2"} bg-white dark:bg-[#1f2c33] border border-border rounded-full px-2 py-0.5 flex items-center gap-1 shadow-md`}
            >
              {reactionCounts.map(({ emoji, count, hasReacted }) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onReact?.(m.id, emoji)}
                  className={`flex items-center gap-0.5 ${hasReacted ? "font-semibold" : ""}`}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Action buttons */}
          <AnimatePresence>
            {showActions && (
              <MessageActions
                onReply={() => {
                  onReply?.(m);
                  setShowActions(false);
                }}
                onReact={() => setShowReactionPicker(!showReactionPicker)}
                onForward={() => {
                  onForward?.(m.id);
                  setShowActions(false);
                }}
                onDelete={() => {
                  onDelete?.(m.id);
                  setShowActions(false);
                }}
                onCopy={handleCopy}
                isMine={isMine}
                position={isMine ? "right" : "left"}
              />
            )}
          </AnimatePresence>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <ReactionPicker
                onSelectReaction={handleReaction}
                onClose={() => setShowReactionPicker(false)}
                position={isMine ? "top" : "bottom"}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Media Viewer */}
      {mediaItems.length > 0 && (
        <MediaViewer
          items={mediaItems}
          initialIndex={mediaViewerIndex}
          open={mediaViewerOpen}
          onOpenChange={setMediaViewerOpen}
        />
      )}
    </motion.div>
  );
}
