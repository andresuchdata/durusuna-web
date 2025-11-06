"use client";

import type { Conversation } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export function ConversationItem({ c, isSelected, isTyping }: { c: Conversation; isSelected?: boolean; isTyping?: boolean }) {
  // For direct chats, use other_user's name
  let title = "Conversation";
  let avatarUrl = c.avatar_url;
  
  if (c.type === "direct" && c.other_user) {
    title = `${c.other_user.first_name} ${c.other_user.last_name}`;
    avatarUrl = c.other_user.avatar_url || avatarUrl;
  } else if (c.name) {
    title = c.name;
  } else if (c.participants && c.participants.length > 0) {
    title = c.participants.map((p) => p.first_name || p.name).filter(Boolean).join(", ");
  }
  
  // Handle both 'text' and 'content' fields for last message
  const last = c.last_message?.text || c.last_message?.content || "No messages yet";
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center gap-3 p-3 border-b border-border dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors duration-150 ${
          isSelected ? 'bg-gray-100 dark:bg-[#2a3942]' : 'bg-white dark:bg-[#111b21]'
        }`}
      >
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate text-foreground text-base">{title}</h3>
            {c.last_message?.created_at && (
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {new Date(c.last_message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {isTyping ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 italic truncate flex-1">
                typing...
              </p>
            ) : (
              <p className="text-sm text-muted-foreground truncate flex-1">{last}</p>
            )}
            {c.unread_count && c.unread_count > 0 ? (
              <span className="ml-2 rounded-full bg-emerald-600 text-white text-xs px-2 py-0.5 font-medium flex-shrink-0">
                {c.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
