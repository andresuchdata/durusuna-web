"use client";

import { EmojiPickerComponent } from "./EmojiPicker";

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
  position?: "top" | "bottom";
}

export function ReactionPicker({ onSelectReaction, onClose, position = "top" }: ReactionPickerProps) {
  return (
    <EmojiPickerComponent
      onSelectEmoji={(emoji) => {
        onSelectReaction(emoji);
        onClose();
      }}
      onClose={onClose}
      position={position}
    />
  );
}

