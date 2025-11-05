"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "../types";
import { Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { MessageActions } from "./MessageActions";
import { ReactionPicker } from "./ReactionPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageItemProps {
  m: Message;
  me: string | null;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onAvatarClick?: (userId: string) => void;
}

export function MessageItem({ m, me, onReply, onDelete, onReact, onAvatarClick }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
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

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setShowActions(false);
  };

  const handleReaction = (emoji: string) => {
    onReact?.(m.id, emoji);
    setShowReactionPicker(false);
  };

  // Count reactions
  const reactionCounts = m.reactions
    ? Object.entries(m.reactions).map(([emoji, userIds]) => ({
        emoji,
        count: userIds.length,
        hasReacted: userIds.includes(me || "")
      }))
    : [];

  const totalReactions = reactionCounts.reduce((sum, r) => sum + r.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar for others' messages */}
      {!isMine && (
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

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%]`}>
        {/* Sender name for others' messages */}
        {!isMine && (
          <span className="text-xs text-muted-foreground mb-0.5 px-2">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div className="relative">
          {/* Reply indicator */}
          {m.reply_to && (
            <div className={`text-xs px-3 py-1 mb-1 border-l-2 ${
              isMine 
                ? "border-emerald-400 bg-emerald-700/50" 
                : "border-emerald-600 bg-gray-100 dark:bg-[#1f2c33]"
            } rounded`}>
              <div className="font-medium opacity-80">{m.reply_to.sender_name}</div>
              <div className="opacity-60 truncate">{m.reply_to.content}</div>
            </div>
          )}

          {/* Main message */}
          <div
            className={`rounded-2xl px-4 py-2 shadow-sm ${
              isMine
                ? "bg-emerald-600 text-white rounded-br-sm"
                : "bg-white dark:bg-[#134e3a] text-foreground dark:text-white rounded-bl-sm"
            }`}
          >
            <p className="text-sm break-words whitespace-pre-wrap">{messageText}</p>
            
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className={`text-[10px] ${isMine ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                {new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isMine && m.status && (
                <span className="text-emerald-100">
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
                  // TODO: Implement forward
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
    </motion.div>
  );
}
