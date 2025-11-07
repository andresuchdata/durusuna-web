"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SuggestionMode, Theme, EmojiStyle } from "emoji-picker-react";

// Dynamically import emoji-picker-react to avoid SSR issues
const EmojiPicker = dynamic(
  () => import("emoji-picker-react"),
  { ssr: false }
);

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  position?: "top" | "bottom";
}

export function EmojiPickerComponent({ onSelectEmoji, onClose, position = "top" }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{
    horizontal: "left" | "right";
    vertical: "top" | "bottom";
    offsetX: number;
    offsetY: number;
  }>({
    horizontal: "left",
    vertical: position,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    const calculatePosition = () => {
      if (!containerRef.current) return;

      // Get the parent element (the relative positioned container)
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const pickerWidth = 320; // Fixed width based on component
      const pickerHeight = 360; // Fixed height based on component
      const spacing = 8; // mb-2 / mt-2 spacing
      const edgePadding = 16; // Padding from viewport edges

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate available space on both sides
      const spaceOnLeft = rect.left;
      const spaceOnRight = viewportWidth - rect.right;

      // Calculate horizontal position and offset
      let horizontal: "left" | "right" = "left";
      let offsetX = 0;

      // Check if picker would overflow on the right when aligned to left
      const wouldOverflowRight = rect.left + pickerWidth > viewportWidth - edgePadding;
      // Check if picker would overflow on the left when aligned to right
      const wouldOverflowLeft = rect.right - pickerWidth < edgePadding;

      if (wouldOverflowRight && !wouldOverflowLeft) {
        // Would overflow right, but has space on left - align to right edge of trigger
        horizontal = "right";
        offsetX = 0;
      } else if (wouldOverflowLeft && !wouldOverflowRight) {
        // Would overflow left, but has space on right - keep left alignment
        horizontal = "left";
        offsetX = 0;
      } else if (wouldOverflowRight && wouldOverflowLeft) {
        // Would overflow on both sides - choose side with more space
        if (spaceOnLeft >= spaceOnRight) {
          // More space on left, align to right edge and adjust
          horizontal = "right";
          // Ensure it doesn't go off the left edge
          const rightEdgePosition = rect.right;
          if (rightEdgePosition - pickerWidth < edgePadding) {
            offsetX = edgePadding - (rightEdgePosition - pickerWidth);
          }
        } else {
          // More space on right, align to left edge and adjust
          horizontal = "left";
          // Ensure it doesn't go off the right edge
          const leftEdgePosition = rect.left;
          if (leftEdgePosition + pickerWidth > viewportWidth - edgePadding) {
            offsetX = (viewportWidth - edgePadding) - (leftEdgePosition + pickerWidth);
          }
        }
      } else {
        // No overflow - default left alignment
        horizontal = "left";
        offsetX = 0;
      }

      // Ensure final position is within viewport bounds
      if (horizontal === "left") {
        const finalLeft = rect.left + offsetX;
        if (finalLeft < edgePadding) {
          offsetX = edgePadding - rect.left;
        } else if (finalLeft + pickerWidth > viewportWidth - edgePadding) {
          offsetX = (viewportWidth - edgePadding - pickerWidth) - rect.left;
        }
      } else {
        // horizontal === "right"
        const finalRight = rect.right + offsetX;
        if (finalRight > viewportWidth - edgePadding) {
          offsetX = (viewportWidth - edgePadding) - rect.right;
        } else if (finalRight - pickerWidth < edgePadding) {
          offsetX = edgePadding + pickerWidth - rect.right;
        }
      }

      // Calculate vertical position
      let vertical: "top" | "bottom" = position;
      let offsetY = 0;

      if (position === "top") {
        // Check if there's enough space above
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.bottom;

        if (spaceAbove < pickerHeight + spacing && spaceBelow >= pickerHeight + spacing) {
          // Show below instead
          vertical = "bottom";
        } else if (spaceAbove < pickerHeight + spacing) {
          // Not enough space above, adjust offset to fit within viewport
          offsetY = Math.max(-(pickerHeight + spacing - spaceAbove), -(rect.top - edgePadding));
        }
      } else {
        // position === "bottom"
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < pickerHeight + spacing && spaceAbove >= pickerHeight + spacing) {
          // Show above instead
          vertical = "top";
        } else if (spaceBelow < pickerHeight + spacing) {
          // Not enough space below, adjust offset to fit within viewport
          offsetY = Math.min(
            pickerHeight + spacing - spaceBelow,
            viewportHeight - rect.bottom - pickerHeight - edgePadding
          );
        }
      }

      setAdjustedPosition({ horizontal, vertical, offsetX, offsetY });
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(calculatePosition, 0);
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [position]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] bg-black/20" 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => {
          // Prevent any other handlers from interfering
          e.stopPropagation();
        }}
      />
      
      {/* Emoji Picker */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: adjustedPosition.vertical === "top" ? 20 : -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: adjustedPosition.vertical === "top" ? 20 : -20 }}
        transition={{ duration: 0.2 }}
        className={`absolute z-[60] ${
          adjustedPosition.vertical === "top" ? "bottom-full mb-2" : "top-full mt-2"
        } ${adjustedPosition.horizontal === "left" ? "left-0" : "right-0"}`}
        style={{
          transform: `translateX(${adjustedPosition.offsetX}px) translateY(${adjustedPosition.offsetY}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-[#1f2c33] border border-border rounded-lg shadow-2xl overflow-hidden 
          [&_.epr-emoji-category-label]:bg-transparent 
          [&_.epr-emoji-category-label]:text-foreground 
          [&_.epr-search-container]:bg-transparent 
          [&_.epr-search-container-input]:bg-background 
          [&_.epr-search-container-input]:border-border 
          [&_.epr-search-container-input]:text-foreground
          [&_.epr-emoji]:hover:bg-gray-100 
          dark:[&_.epr-emoji]:hover:bg-[#2a3942]
          [&_.epr-body]:bg-transparent
          [&_.epr-header]:bg-transparent
          [&_.epr-category-nav]:bg-transparent
          [&_.epr-category-nav-button]:hover:bg-gray-100
          dark:[&_.epr-category-nav-button]:hover:bg-[#2a3942]
          [&_.epr-category-nav-button-active]:bg-emerald-100
          dark:[&_.epr-category-nav-button-active]:bg-emerald-900/30
          [&_.epr-category-nav-button-active]:text-emerald-700
          dark:[&_.epr-category-nav-button-active]:text-emerald-400">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onSelectEmoji(emojiData.emoji);
              onClose();
            }}
            width={320}
            height={360}
            previewConfig={{
              showPreview: false,
            }}
            searchDisabled={false}
            skinTonesDisabled={false}
            theme={Theme.AUTO}
            autoFocusSearch={true}
            lazyLoadEmojis={true}
            emojiStyle={EmojiStyle.NATIVE}
            suggestedEmojisMode={SuggestionMode.RECENT}
          />
        </div>
      </motion.div>
    </>
  );
}
