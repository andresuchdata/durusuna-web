"use client";

import { X, FileText, Image as ImageIcon, Video, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { formatFileSize, type MediaFile } from "@/shared/hooks/useMediaUpload";

interface MediaPreviewProps {
  mediaFiles: MediaFile[];
  onRemove: (id: string) => void;
  variant?: "compact" | "full";
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
}

export function MediaPreview({ mediaFiles, onRemove, variant = "compact" }: MediaPreviewProps) {
  if (mediaFiles.length === 0) return null;

  if (variant === "full") {
    // Full preview for single item or list view
    return (
      <div className="space-y-2">
        {mediaFiles.map((media) => (
          <div key={media.id} className="relative group">
            {media.type.startsWith('image/') && media.preview ? (
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={media.preview}
                  alt={media.name}
                  width={400}
                  height={300}
                  className="w-full h-auto max-h-64 object-cover"
                  unoptimized
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(media.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : media.type.startsWith('video/') && media.preview ? (
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <video
                  src={media.preview}
                  className="w-full h-auto max-h-64 object-cover"
                  controls
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(media.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {getFileIcon(media.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{media.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(media.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(media.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Compact WhatsApp-style grid preview
  return (
    <div className="flex gap-2 flex-wrap p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-border">
      {mediaFiles.map((media) => (
        <div key={media.id} className="relative group">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
            {media.type.startsWith('image/') && media.preview ? (
              <Image
                src={media.preview}
                alt={media.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : media.type.startsWith('video/') && media.preview ? (
              <>
                <video
                  src={media.preview}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Video className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                {getFileIcon(media.type)}
                <span className="text-[10px] text-center truncate w-full mt-1">
                  {media.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Remove button */}
            <button
              onClick={() => onRemove(media.id)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Upload progress */}
            {media.isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-xs">
                  {media.uploadProgress || 0}%
                </div>
              </div>
            )}

            {/* Error indicator */}
            {media.error && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 text-xs">✕</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

