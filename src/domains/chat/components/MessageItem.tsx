"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "../types";
import { Check, CheckCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MessageActions } from "./MessageActions";
import { ReactionPicker } from "./ReactionPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaThumbnailGrid, MediaViewer } from "@/components/media/MediaViewer";
import type { MediaItem } from "@/components/media/MediaViewer";
import { ImagePreview, useImagePreview } from "@/components/ui/image-preview";
import { FileAttachment } from "./FileAttachment";

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
  const [isMobile, setIsMobile] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const { isOpen, imageSrc, imageAlt, imageTitle, openPreview, closePreview } = useImagePreview();
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressThreshold = 500; // 500ms for long press
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 1024; // Increased threshold to include tablets
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      setIsMobile(isTouchDevice && (isSmallScreen || isMobileUA));
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Handle closing actions when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || (!showActions && !isSelected)) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      const messageElement = target.closest(`[data-message-id="${m.id}"]`);
      const actionsElement = target.closest('[data-message-actions]');
      
      // Only close if click is completely outside this message and its actions
      if (!messageElement && !actionsElement) {
        setShowActions(false);
        setShowReactionPicker(false);
        setIsSelected(false);
        setIsLongPressing(false);
      }
    };

    // Use both touchstart and click for better coverage
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobile, showActions, isSelected, m.id]);
  
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

  // Separate media files from document files
  const attachments = m.attachments || [];
  const mediaItems: MediaItem[] = [];
  const fileAttachments: typeof attachments = [];

  attachments.forEach((att) => {
    const type = att.mimeType || att.type || 'file';
    if (type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/')) {
      mediaItems.push({
        id: att.id,
        name: att.originalName || att.fileName || att.type?.split('/').pop() || 'file',
        url: att.url,
        type: type,
        size: att.size,
      });
    } else {
      fileAttachments.push(att);
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setShowActions(false);
    setIsSelected(false);
    setIsLongPressing(false);
  };

  const handleReaction = (emoji: string) => {
    const messageId = m.id || m.serverId;
    if (!messageId) {
      console.error("Message ID is missing:", m);
      return;
    }
    if (!onReact) {
      console.warn("onReact callback is not provided; reaction ignored.");
      setShowReactionPicker(false);
      return;
    }
    try {
      onReact(messageId, emoji);
    } catch (error) {
      console.error("Error calling onReact:", error);
    }
    setShowReactionPicker(false);
    // Keep actions open for potential additional reactions, but close other states
    setIsLongPressing(false);
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

  // Touch and long press handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // Don't start long press if actions are already showing
    if (showActions) return;
    
    // Store initial touch position
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Set long pressing state for visual feedback
    setIsLongPressing(true);
    
    // Don't prevent default to allow scrolling
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(false);
      setIsSelected(true);
      setShowActions(true);
      // Add haptic feedback if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, longPressThreshold);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    const hadTimer = longPressTimer.current !== null;
    
    // Clear long pressing state
    setIsLongPressing(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    touchStartPos.current = null;
    
    // If we had a timer running but actions aren't showing, it was a tap
    // Only prevent default if we successfully triggered long press
    if (hadTimer && !showActions) {
      // This was a cancelled long press, allow normal behavior
      return;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !longPressTimer.current || !touchStartPos.current) return;
    
    // Cancel long press if user moves finger too much
    const touch = e.touches[0];
    const moveThreshold = 10; // pixels
    
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      // Clear visual feedback states
      setIsLongPressing(false);
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      touchStartPos.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} group mobile-optimized`}
      data-message-id={m.id}
      // Desktop interactions (hover)
      onMouseEnter={() => !isMobile && setShowActions(true)}
      onMouseLeave={() => {
        if (!isMobile) {
          setShowActions(false);
          setShowReactionPicker(false);
        }
      }}
      // Mobile interactions (long press)
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      // Handle clicks - different behavior for mobile vs desktop
      onClick={(e) => {
        if (isMobile) {
          // On mobile, clicks should close actions if they're open
          if (showActions || isSelected) {
            const target = e.target as Element;
            const actionsElement = target.closest('[data-message-actions]');
            
            // Close actions if clicking outside of action buttons
            if (!actionsElement) {
              setShowActions(false);
              setShowReactionPicker(false);
              setIsSelected(false);
              setIsLongPressing(false);
            }
          }
        }
        // Allow normal behavior for non-mobile or for specific elements
      }}
    >
      {/* Avatar for others' messages (only in group chats) */}
      {!isMine && conversationType === "group" && (
        <Avatar 
          className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity mt-1" 
          onClick={() => {
            if (m.sender?.avatar_url) {
              openPreview(m.sender.avatar_url, `${senderName} Avatar`, senderName);
            } else {
              onAvatarClick?.(senderId || "");
            }
          }}
        >
          <AvatarImage src={m.sender?.avatar_url} alt={senderName} />
          <AvatarFallback className="bg-emerald-600 text-white text-xs">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%] w-full min-w-0`}>
        {/* Sender name for others' messages (only in group chats) */}
        {!isMine && conversationType === "group" && (
          <span className="text-xs text-muted-foreground mb-0.5 px-2 select-none touch-manipulation">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div className={`relative w-fit min-w-[80px] ${
          messageText && messageText.length > 50 
            ? 'max-w-[85%]' 
            : messageText && messageText.length > 20
              ? 'max-w-[80%]' 
              : 'max-w-[70%]'
        }`}>
          {/* Main message */}
          <div
            className={`
              message-bubble rounded-2xl shadow-sm w-full overflow-hidden 
              transition-all duration-200
              ${messageText ? 'px-4 py-2' : mediaItems.length > 0 ? 'p-2' : 'px-4 py-2'}
              ${
                // Base colors
                isMine
                  ? "text-gray-900 rounded-br-sm"
                  : "text-foreground dark:text-white rounded-bl-sm"
              }
              ${
                // Background colors with selection states
                isLongPressing
                  ? (isMine 
                      ? "bg-emerald-200 shadow-lg" 
                      : "bg-gray-200 dark:bg-[#0f3d2f] shadow-lg")
                  : (showActions || isSelected) && isMobile
                    ? (isMine 
                        ? "bg-emerald-200 ring-2 ring-emerald-300" 
                        : "bg-gray-100 dark:bg-[#1a4a3a] ring-2 ring-gray-300 dark:ring-emerald-400")
                    : (isMine
                        ? "bg-emerald-100"
                        : "bg-white dark:bg-[#134e3a]")
              }
            `}
          >
            {/* Reply indicator - WhatsApp style - INSIDE the bubble */}
            {m.reply_to && (
              <div 
                className={`flex items-start gap-2 px-2.5 mx-[-0.5rem] py-1.5 mb-2 rounded-md w-[100% + .5rem] ${
                  isMine 
                    ? "bg-emerald-400/40 border-l-4 border-emerald-700" 
                    : "bg-gray-100 dark:bg-[#1f2c33] border-l-4 border-emerald-600"
                } cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent message click handler
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
                <div className="flex-1 min-w-0 w-full overflow-hidden select-none">
                  <div className={`text-xs font-semibold mb-0.5 truncate select-none ${
                    isMine 
                      ? "text-emerald-900" 
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {m.reply_to.sender_name}
                  </div>
                  <div className={`text-xs line-clamp-2 select-none ${
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

            {/* File attachments */}
            {fileAttachments.length > 0 && (
              <div className="space-y-2 mb-2">
                {fileAttachments.map((attachment) => (
                  <FileAttachment
                    key={attachment.id}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {messageText && (
              <p className="text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere select-none touch-manipulation">{messageText}</p>
            )}
            
            <div className="flex items-center justify-end gap-1 mt-1 flex-shrink-0 select-none">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap select-none touch-manipulation">
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
              className={`absolute -bottom-1 left-2 bg-white dark:bg-[#1f2c33] border border-border rounded-full px-2 py-0.5 shadow-md z-10`}
              style={{ 
                maxWidth: 'calc(100% - 0.5rem)'
              }}
            >
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide select-none" style={{ maxWidth: '100%' }}>
                {reactionCounts.map(({ emoji, count, hasReacted }) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent message click handler
                      handleReaction(emoji);
                    }}
                    className={`flex items-center gap-0.5 flex-shrink-0 select-none touch-manipulation ${hasReacted ? "font-semibold" : ""}`}
                  >
                    <span className="text-sm select-none">{emoji}</span>
                    <span className="text-xs text-muted-foreground select-none">{count}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <AnimatePresence>
            {showActions && (
              <MessageActions
                onReply={() => {
                  onReply?.(m);
                  setShowActions(false);
                  setIsSelected(false);
                  setIsLongPressing(false);
                }}
                onReact={() => setShowReactionPicker(!showReactionPicker)}
                onForward={() => {
                  onForward?.(m.id);
                  setShowActions(false);
                  setIsSelected(false);
                  setIsLongPressing(false);
                }}
                onDelete={() => {
                  onDelete?.(m.id);
                  setShowActions(false);
                  setIsSelected(false);
                  setIsLongPressing(false);
                }}
                onCopy={() => {
                  handleCopy();
                  setIsSelected(false);
                  setIsLongPressing(false);
                }}
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

      {/* Image Preview Modal */}
      <ImagePreview
        src={imageSrc}
        alt={imageAlt}
        title={imageTitle}
        isOpen={isOpen}
        onClose={closePreview}
      />
    </motion.div>
  );
}
