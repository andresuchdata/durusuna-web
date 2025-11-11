"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { X, Download, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface MediaViewerProps {
  items: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaViewer({ items, initialIndex = 0, open, onOpenChange }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Reset index when dialog opens or items change
  React.useEffect(() => {
    if (open && items.length > 0) {
      const validIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
      setCurrentIndex(validIndex);
      setZoom(100);
      setRotation(0);
    }
  }, [open, initialIndex, items.length]);

  // Ensure currentIndex is within bounds
  const safeIndex = Math.max(0, Math.min(currentIndex, items.length - 1));
  const currentItem = items[safeIndex];
  
  // Early return if no valid item
  if (!currentItem || items.length === 0) {
    return null;
  }

  const isImage = currentItem.type?.startsWith('image/') ?? false;
  const isVideo = currentItem.type?.startsWith('video/') ?? false;
  const isPDF = currentItem.type === 'application/pdf';
  const isDocument = 
    currentItem.type?.includes('word') || 
    currentItem.type?.includes('document') ||
    currentItem.type?.includes('spreadsheet') ||
    currentItem.type?.includes('presentation') ||
    currentItem.type?.includes('excel') ||
    currentItem.type?.includes('powerpoint');

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setZoom(100);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setZoom(100);
    setRotation(0);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!currentItem) return;
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = currentItem.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-[95vh] flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{currentItem.name}</h3>
                <p className="text-sm text-gray-300">
                  {safeIndex + 1} of {items.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isImage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
                      className="text-white hover:bg-white/20"
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">{zoom}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomIn}
                      className="text-white hover:bg-white/20"
                      disabled={zoom >= 200}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRotate}
                      className="text-white hover:bg-white/20"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {isImage && (
              <div className="relative w-full h-full flex items-center justify-center">
                <div
                  className="relative transition-transform"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <Image
                    src={currentItem.url}
                    alt={currentItem.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {isVideo && (
              <video
                src={currentItem.url}
                controls
                className="max-w-full max-h-full"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            )}

            {isPDF && (
              <iframe
                src={`${currentItem.url}#view=FitH`}
                className="w-full h-full border-0"
                title={currentItem.name}
              />
            )}

            {isDocument && (
              <div className="flex flex-col items-center justify-center gap-4 text-white">
                <FileText className="h-20 w-20 text-gray-400" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">{currentItem.name}</h3>
                  <p className="text-gray-400 mb-4">
                    Document preview not available
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                    <Button
                      onClick={() => window.open(currentItem.url, '_blank')}
                      variant="ghost"
                      className="text-white border border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isImage && !isVideo && !isPDF && !isDocument && (
              <div className="flex flex-col items-center justify-center gap-4 text-white">
                <File className="h-20 w-20 text-gray-400" />
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">{currentItem.name}</h3>
                  <p className="text-gray-400 mb-4">
                    Preview not available for this file type
                  </p>
                  <Button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Thumbnail Strip (for multiple items) */}
          {items.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex gap-2 overflow-x-auto">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(100);
                      setRotation(0);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === safeIndex
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
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
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 4l10 6-10 6V4z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Thumbnail Grid Component for displaying media attachments
interface MediaThumbnailGridProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
}

export function MediaThumbnailGrid({ items, onItemClick }: MediaThumbnailGridProps) {
  if (items.length === 0) return null;

  // Limit to maximum 7 items
  const displayItems = items.slice(0, 7);
  const totalItems = displayItems.length;
  const remainingCount = totalItems > 4 ? totalItems - 4 : 0;

  // Single item: full width display - MUCH BIGGER for better preview
  if (totalItems === 1) {
    const item = displayItems[0];
    return (
      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onItemClick(0)}>
        {item.type?.startsWith('image/') ? (
          <div className="relative w-full h-auto max-h-[500px]">
            <Image
              src={item.url}
              alt={item.name}
              width={800}
              height={600}
              className="w-full h-auto max-h-[500px] object-cover"
              unoptimized
            />
          </div>
        ) : item.type?.startsWith('video/') ? (
          <div className="relative">
            <video src={item.url} className="w-full h-auto max-h-[500px] object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 4l10 6-10 6V4z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-muted-foreground">Click to view</p>
            </div>
            <Download className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // Determine grid layout based on item count
  const getGridClass = () => {
    if (totalItems === 2) return 'grid-cols-2';
    if (totalItems === 3) return 'grid-cols-3';
    // For 4+ items, always use 2x2 grid showing max 4 tiles
    return 'grid-cols-2';
  };

  // Show maximum 4 tiles, with overlay on 4th if there are more
  const tilesToShow = Math.min(totalItems, 4);

  return (
    <div className={`grid gap-2 ${getGridClass()}`}>
      {displayItems.slice(0, tilesToShow).map((item, index) => (
        <div
          key={item.id}
          onClick={() => onItemClick(index)}
          className="relative aspect-square cursor-pointer hover:opacity-90 transition-opacity overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 min-h-[200px]"
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
          
          {/* Show overlay on 4th tile if there are more than 4 items */}
          {index === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+{remainingCount}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

