"use client";

import { motion } from "framer-motion";
import type { Message } from "../types";
import { Check, CheckCheck } from "lucide-react";

export function MessageItem({ m, me }: { m: Message; me: string | null }) {
  const senderId = m.sender_id || m.senderId || m.sender?.id;
  const isMine = senderId === me;
  const messageText = m.text || m.content || '';
  const timestamp = m.created_at || m.createdAt || new Date().toISOString();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm ${
          isMine
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-white dark:bg-[#134e3a] text-foreground dark:text-white rounded-bl-sm"
        }`}
      >
        <p className="text-sm break-words">{messageText}</p>
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
    </motion.div>
  );
}
