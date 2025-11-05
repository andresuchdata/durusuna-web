"use client";

import { motion } from "framer-motion";
import { Reply, Forward, Smile, Trash2, Copy } from "lucide-react";

interface MessageActionsProps {
  onReply: () => void;
  onReact: () => void;
  onForward: () => void;
  onDelete: () => void;
  onCopy: () => void;
  isMine: boolean;
  position?: "left" | "right";
}

export function MessageActions({
  onReply,
  onReact,
  onForward,
  onDelete,
  onCopy,
  isMine,
  position = "right"
}: MessageActionsProps) {
  const actions = [
    { icon: Reply, label: "Reply", onClick: onReply, show: true },
    { icon: Smile, label: "React", onClick: onReact, show: true },
    { icon: Forward, label: "Forward", onClick: onForward, show: true },
    { icon: Copy, label: "Copy", onClick: onCopy, show: true },
    { icon: Trash2, label: "Delete", onClick: onDelete, show: isMine, danger: true },
  ].filter(a => a.show);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      transition={{ duration: 0.1 }}
      className={`absolute ${
        position === "right" ? "-top-10 right-0" : "-top-10 left-0"
      } bg-white dark:bg-[#1f2c33] border border-border rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1 z-50`}
    >
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.1, backgroundColor: action.danger ? "#fee2e2" : "#f3f4f6" }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className={`p-2 rounded-lg transition-colors ${
              action.danger 
                ? "hover:bg-red-50 dark:hover:bg-red-900/20" 
                : "hover:bg-gray-100 dark:hover:bg-[#2a3942]"
            }`}
            title={action.label}
          >
            <Icon className={`h-4 w-4 ${action.danger ? "text-red-600" : "text-muted-foreground"}`} />
          </motion.button>
        );
      })}
    </motion.div>
  );
}

