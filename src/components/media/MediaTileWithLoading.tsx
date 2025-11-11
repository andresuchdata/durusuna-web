"use client";

import Image from "next/image";
import { FileText, Loader2 } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";

export interface MediaTileProps {
  item: {
    id: string;
    name: string;
    url: string;
    type?: string;
    size?: number;
    progress?: number; // 0-100 for upload progress
  };
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MediaTileWithLoading({ 
  item, 
  isLoading = false, 
  onClick, 
  className = "" 
}: MediaTileProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}
    >
      {item.type?.startsWith('image/') ? (
        <div className="relative w-full h-full">
          <Image
            src={item.url}
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : item.type?.startsWith('video/') ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4l10 6-10 6V4z" />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText className="h-12 w-12 text-blue-600" />
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          {item.progress !== undefined && item.progress >= 0 ? (
            <CircularProgress progress={item.progress} size={48} />
          ) : (
            <div className="bg-white/90 rounded-full p-3">
              <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface MediaGridWithLoadingProps {
  items: Array<{
    id: string;
    name: string;
    url: string;
    type?: string;
    size?: number;
    isLoading?: boolean;
    progress?: number; // 0-100 for upload progress
  }>;
  onItemClick?: (index: number) => void;
}

export function MediaGridWithLoading({ items, onItemClick }: MediaGridWithLoadingProps) {
  if (items.length === 0) return null;

  // Limit to maximum 7 items
  const displayItems = items.slice(0, 7);
  const totalItems = displayItems.length;
  const remainingCount = totalItems > 4 ? totalItems - 4 : 0;

  // Single item: full width display - MUCH BIGGER for better preview
  if (totalItems === 1) {
    const item = displayItems[0];
    return (
      <MediaTileWithLoading
        item={item}
        isLoading={item.isLoading}
        onClick={() => onItemClick?.(0)}
        className="w-full h-auto max-h-[500px] aspect-auto"
      />
    );
  }

  const getGridClass = () => {
    if (totalItems === 2) return 'grid-cols-2';
    if (totalItems === 3) return 'grid-cols-3';
    return 'grid-cols-2';
  };

  const tilesToShow = Math.min(totalItems, 4);

  return (
    <div className={`grid gap-2 ${getGridClass()}`}>
      {displayItems.slice(0, tilesToShow).map((item, index) => (
        <div key={item.id} className="relative">
          <MediaTileWithLoading
            item={item}
            isLoading={item.isLoading}
            onClick={() => onItemClick?.(index)}
            className="aspect-square min-h-[200px]"
          />
          
          {/* Show overlay on 4th tile if there are more than 4 items */}
          {index === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <span className="text-white text-2xl font-bold">+{remainingCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
