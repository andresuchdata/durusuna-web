"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MediaGridWithLoading } from "@/components/media/MediaTileWithLoading";
import { Loader2 } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import type { ClassUpdateFormData } from "./ClassUpdateForm";

export interface OptimisticClassUpdateProps {
  formData: ClassUpdateFormData;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  className?: string;
  uploadProgress?: Record<string, number>; // fileId -> progress percentage
  isUploading?: boolean;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function OptimisticClassUpdate({
  formData,
  author,
  className,
  uploadProgress = {},
  isUploading = false
}: OptimisticClassUpdateProps) {
  const initials = (author.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Convert uploaded attachments to media items with progress
  const mediaItems = formData.uploadedAttachments
    ?.filter(att => att.type?.startsWith('image/') || att.type?.startsWith('video/'))
    .map(att => {
      // Use consistent fileId generation - try multiple possible keys
      const possibleKeys = [
        att.id,
        att.fileName,
        att.originalName,
        (att.name || 'unknown') + att.size,
        att.size?.toString()
      ].filter(Boolean);
      
      let progress = 0;
      // Find progress using any of the possible keys
      for (const key of possibleKeys) {
        if (uploadProgress[key as string] !== undefined) {
          progress = uploadProgress[key as string];
          break;
        }
      }
      
      return {
        id: att.id || att.fileName || att.originalName || (att.name || 'unknown') + att.size,
        name: att.name || att.fileName || att.originalName || 'Unknown file',
        url: att.url,
        type: att.type,
        size: att.size,
        isLoading: isUploading,
        progress,
      };
    }) || [];

  // Non-media attachments
  const fileAttachments = formData.uploadedAttachments
    ?.filter(att => !att.type?.startsWith('image/') && !att.type?.startsWith('video/')) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 0.8, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full"
    >
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 ${className}`}>
        <CardContent className="p-0">
          {/* Draft Indicator */}
          <div className="bg-blue-100 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center gap-2">
            <Loader2 className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Publishing...</span>
          </div>
          
          {/* Header */}
          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={author.avatar} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{author.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(new Date().toISOString())}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {formData.updateType && (
                      <Badge 
                        variant={
                          formData.updateType === 'homework' ? 'destructive' :
                          formData.updateType === 'event' ? 'default' :
                          formData.updateType === 'reminder' ? 'outline' :
                          'secondary'
                        }
                        className="text-xs capitalize"
                      >
                        {formData.updateType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Title with Class Badge */}
            <div className="flex items-center gap-2 mb-2">
              {formData.title && <h2 className="text-xl font-bold">{formData.title}</h2>}
              {className && (
                <Badge variant="secondary" className="text-xs">
                  {className}
                </Badge>
              )}
            </div>

            {/* Content with basic formatting */}
            <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert opacity-90">
              {formData.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Media Preview */}
          {mediaItems.length > 0 && (
            <div className="relative px-4 pb-4">
              <MediaGridWithLoading
                items={mediaItems}
                onItemClick={() => {}} // No action for optimistic updates
              />
            </div>
          )}

          {/* File Attachments */}
          {fileAttachments.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              {fileAttachments.map((attachment) => {
                // Use consistent fileId generation - try multiple possible keys
                const possibleKeys = [
                  attachment.id,
                  attachment.fileName,
                  attachment.originalName,
                  (attachment.name || 'unknown') + attachment.size,
                  attachment.size?.toString()
                ].filter(Boolean);
                
                let progress = 0;
                // Find progress using any of the possible keys
                for (const key of possibleKeys) {
                  if (uploadProgress[key as string] !== undefined) {
                    progress = uploadProgress[key as string];
                    break;
                  }
                }
                
                const fileId = attachment.id || attachment.fileName || attachment.originalName || (attachment.name || 'unknown') + attachment.size;
                
                return (
                  <div key={fileId} className="relative">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {attachment.name || 'Unknown file'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {attachment.type} • {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    {/* Loading overlay for file attachments with progress */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        {progress >= 0 ? (
                          <CircularProgress progress={progress} size={32} />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Status */}
          <div className="px-4 pb-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating class update...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
