"use client";

import type { Conversation } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePreview, useImagePreview } from "@/components/ui/image-preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteConversation } from "../api";
import { formatConversationTime } from "@/lib/dateUtils";
import { useQueryClient } from "@tanstack/react-query";
import { generateAttachmentDescription } from "../utils/attachmentDescriptions";

export function ConversationItem({ 
  c, 
  isSelected, 
  isTyping, 
  onSelect 
}: { 
  c: Conversation; 
  isSelected?: boolean; 
  isTyping?: boolean;
  onSelect?: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOpen, imageSrc, imageAlt, imageTitle, openPreview, closePreview } = useImagePreview();

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
  let last = c.last_message?.text || c.last_message?.content || "";
  
  // If no text content but has attachments, show attachment description
  if (!last && c.last_message) {
    const attachmentDesc = generateAttachmentDescription(c.last_message);
    last = attachmentDesc || "No messages yet";
  }
  
  // Final fallback
  if (!last) {
    last = "No messages yet";
  }
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const action = c.type === 'group' ? 'leave' : 'delete';
      console.log(`[ConversationItem] Starting ${action} for conversation:`, c.id);
      
      const result = await deleteConversation(c.id);
      console.log(`[ConversationItem] ${action} completed for conversation:`, c.id, result);
      
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete/leave conversation:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  const handleClick = () => {
    setContextMenuVisible(false);
    onSelect?.();
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (avatarUrl) {
      openPreview(avatarUrl, `${title} Avatar`, title);
    } else {
      router.push(`/conversations/${c.id}/profile`);
    }
  };

  const handleDeleteClick = () => {
    setContextMenuVisible(false);
    setShowDeleteDialog(true);
  };

  // Close context menu when clicking elsewhere
  React.useEffect(() => {
    const handleClickOutside = () => setContextMenuVisible(false);
    if (contextMenuVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuVisible]);

  return (
    <>
      <div className="relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-3 p-3 border-b border-border dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors duration-150 cursor-pointer ${
                isSelected ? 'bg-gray-100 dark:bg-[#2a3942]' : 'bg-white dark:bg-[#111b21]'
              }`}
              onClick={handleClick}
              onContextMenu={handleContextMenu}
            >
              <button 
                onClick={handleAvatarClick}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate text-foreground text-base">{title}</h3>
                  {c.last_message?.created_at && (
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatConversationTime(c.last_message.created_at)}
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

        {/* Custom Context Menu */}
        {contextMenuVisible && (
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[120px]"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
              {c.type === 'group' ? 'Leave' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.type === 'group' ? 'Leave Group' : 'Delete Conversation'}</AlertDialogTitle>
            <AlertDialogDescription>
              {c.type === 'group' 
                ? `Are you sure you want to leave the group "${title}"? You can be re-added later by other members.`
                : `Are you sure you want to delete your conversation with ${title}? This will only remove it from your view.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting 
                ? (c.type === 'group' ? 'Leaving...' : 'Deleting...') 
                : (c.type === 'group' ? 'Leave' : 'Delete')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal */}
      <ImagePreview
        src={imageSrc}
        alt={imageAlt}
        title={imageTitle}
        isOpen={isOpen}
        onClose={closePreview}
      />
    </>
  );
}
