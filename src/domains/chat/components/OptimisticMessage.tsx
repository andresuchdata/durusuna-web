"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaGridWithLoading } from "@/components/media/MediaTileWithLoading";
import { FileAttachment } from "./FileAttachment";
import { Loader2 } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";

export interface OptimisticMessageProps {
  text?: string;
  files: File[];
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  conversationType?: "direct" | "group";
  uploadProgress?: Record<string, number>; // fileId -> progress percentage
  me?: string; // Current user ID for positioning
}

export function OptimisticMessage({ 
  text, 
  files, 
  sender, 
  conversationType = "group",
  uploadProgress = {},
  me
}: OptimisticMessageProps) {
  const hasText = text && text.trim().length > 0;
  
  // Determine if this is the current user's message for positioning
  const isMine = sender.id === me;
  
  // Convert files to media items with loading state and progress
  const mediaItems = files
    .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
    .map(file => {
      const fileId = file.name + file.size;
      return {
        id: fileId,
        name: file.name,
        url: URL.createObjectURL(file), // Create preview URL
        type: file.type,
        size: file.size,
        isLoading: true, // Always loading for optimistic messages
        progress: uploadProgress[fileId] || 0, // Get progress for this file
      };
    });

  // Convert files to file attachments with progress
  const fileAttachments = files
    .filter(file => !file.type.startsWith('image/') && !file.type.startsWith('video/'))
    .map(file => {
      const fileId = file.name + file.size;
      return {
        id: fileId,
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: '', // No URL for non-media files
        key: file.name,
        fileType: getFileType(file.type),
        isImage: false,
        isVideo: false,
        isAudio: file.type.startsWith('audio/'),
        isDocument: isDocumentType(file.type),
        sizeFormatted: formatFileSize(file.size),
        uploadedBy: sender.id,
        uploadedAt: new Date().toISOString(),
        progress: uploadProgress[fileId] || 0, // Get progress for this file
      };
    });

  function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (isDocumentType(mimeType)) return 'document';
    return 'other';
  }

  function isDocumentType(mimeType: string): boolean {
    return mimeType.includes('pdf') || 
           mimeType.includes('document') || 
           mimeType.includes('spreadsheet') || 
           mimeType.includes('text/') ||
           mimeType.includes('application/');
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.7, y: 0 }} // Slightly transparent to show it's optimistic
      className={`flex gap-2 px-4 py-2 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar for others' messages (only in group chats) */}
      {!isMine && conversationType === "group" && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={sender.avatar_url} />
          <AvatarFallback className="text-xs">
            {sender.first_name?.[0]}{sender.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%] w-full min-w-0`}>
        {/* Sender name for others' messages (only in group chats) */}
        {!isMine && conversationType === "group" && (
          <span className="text-xs text-muted-foreground mb-0.5 px-2">
            {sender.first_name} {sender.last_name}
          </span>
        )}

        {/* Message bubble */}
        <div className="relative w-fit min-w-[80px] max-w-full">
          <div
            className={`
              message-bubble rounded-2xl shadow-sm w-full overflow-hidden 
              transition-all duration-200 
              ${isMine 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white dark:bg-gray-800 text-foreground border border-border'
              }
              ${hasText ? 'px-4 py-2' : mediaItems.length > 0 || fileAttachments.length > 0 ? 'p-2' : 'px-4 py-2'}
            `}
          >
            {/* Media attachments */}
            {mediaItems.length > 0 && (
              <div className={hasText ? "mb-2" : ""}>
                <MediaGridWithLoading
                  items={mediaItems}
                  onItemClick={() => {}} // No action for optimistic messages
                />
              </div>
            )}

            {/* File attachments */}
            {fileAttachments.length > 0 && (
              <div className={`space-y-2 ${hasText ? "mb-2" : ""}`}>
                {fileAttachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    <FileAttachment attachment={attachment} />
                    {/* Loading overlay for file attachments with progress */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded">
                      {attachment.progress !== undefined && attachment.progress >= 0 ? (
                        <CircularProgress progress={attachment.progress} size={32} />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text content */}
            {hasText && (
              <p className="text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere select-none touch-manipulation">
                {text}
              </p>
            )}

            {/* Timestamp and status */}
            <div className={`flex items-center justify-end gap-1 flex-shrink-0 select-none ${hasText || mediaItems.length > 0 || fileAttachments.length > 0 ? "mt-1" : ""}`}>
              <Loader2 className="h-3 w-3 animate-spin opacity-70" />
              <span className="text-[10px] opacity-70 whitespace-nowrap select-none touch-manipulation">
                Sending...
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
