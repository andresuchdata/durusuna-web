"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const ALL_REACTIONS = [
  "👍", "❤️", "😂", "😮", "😢", "🙏",
  "🔥", "🎉", "👏", "💯", "✅", "❌"
];

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
  position?: "top" | "bottom";
}

export function ReactionPicker({ onSelectReaction, onClose, position = "top" }: ReactionPickerProps) {
  const [showAll, setShowAll] = useState(false);

  const reactions = showAll ? ALL_REACTIONS : QUICK_REACTIONS;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Reaction Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: position === "top" ? 10 : -10 }}
        transition={{ duration: 0.15 }}
        className={`absolute z-50 ${
          position === "top" ? "-top-14" : "-bottom-14"
        } left-0 bg-white dark:bg-[#1f2c33] border border-border rounded-full shadow-lg px-2 py-2 flex items-center gap-1`}
      >
        {reactions.map((emoji) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onSelectReaction(emoji);
              onClose();
            }}
            className="text-2xl hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-muted-foreground hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full w-10 h-10 flex items-center justify-center ml-1 border-l border-border transition-colors"
        >
          {showAll ? "−" : "+"}
        </motion.button>
      </motion.div>
    </>
  );
}

