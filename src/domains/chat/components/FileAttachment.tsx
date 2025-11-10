"use client";

import { File, Download, Image as ImageIcon, Video, Music, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttachmentData } from "@/shared/types/attachment";
import { 
  getAttachmentDisplayName, 
  getAttachmentMimeType, 
  getAttachmentSizeFormatted 
} from "@/shared/types/attachment";

interface FileAttachmentProps {
  attachment: AttachmentData;
  onDownload?: () => void;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-500" />;
  if (type.startsWith('video/')) return <Video className="h-6 w-6 text-red-500" />;
  if (type.startsWith('audio/')) return <Music className="h-6 w-6 text-green-500" />;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
    return <FileText className="h-6 w-6 text-purple-500" />;
  }
  return <File className="h-6 w-6 text-gray-500" />;
}

export function FileAttachment({ attachment, onDownload }: FileAttachmentProps) {
  const fileName = getAttachmentDisplayName(attachment);
  const fileSize = getAttachmentSizeFormatted(attachment);
  
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-xs">
      <div className="flex-shrink-0 mr-3">
        {getFileIcon(getAttachmentMimeType(attachment))}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {fileName}
        </p>
        {fileSize && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fileSize}
          </p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="ml-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
