"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, FileText, Image as ImageIcon, Video, File, Loader2 } from "lucide-react";
import { uploadAttachments } from "@/domains/class-updates/api";
import { Badge } from "@/components/ui/badge";
import type { AttachmentData } from "@/shared/types/attachment";
import { 
  getAttachmentDisplayName, 
  getAttachmentMimeType, 
  getAttachmentSizeFormatted,
  formatFileSize
} from "@/shared/types/attachment";

const UPDATE_TYPES = [
  { value: 'announcement', label: 'Announcement', color: 'bg-blue-100 text-blue-700' },
  { value: 'homework', label: 'Homework', color: 'bg-red-100 text-red-700' },
  { value: 'reminder', label: 'Reminder', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'event', label: 'Event', color: 'bg-green-100 text-green-700' },
] as const;

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

export interface ClassUpdateFormData {
  classId: string;
  title: string;
  content: string;
  updateType: 'announcement' | 'homework' | 'reminder' | 'event';
  existingAttachments: AttachmentData[];
  uploadedAttachments: AttachmentData[];
}

interface ClassUpdateFormProps {
  // Mode
  mode: 'create' | 'edit';
  
  // Initial values
  initialClassId?: string;
  initialClassName?: string;
  initialTitle?: string;
  initialContent?: string;
  initialUpdateType?: 'announcement' | 'homework' | 'reminder' | 'event';
  initialAttachments?: AttachmentData[];
  
  // Class selection (for create mode)
  classes?: Array<{ id: string; name: string }>;
  
  // State and handlers
  formData: ClassUpdateFormData;
  onFormDataChange: (data: Partial<ClassUpdateFormData>) => void;
  errors: Record<string, string>;
  onErrorsChange: (errors: Record<string, string>) => void;
  isUploading: boolean;
  onUploadingChange: (isUploading: boolean) => void;
}

export function ClassUpdateForm({
  mode,
  initialClassId,
  initialClassName,
  initialTitle = '',
  initialContent = '',
  initialUpdateType = 'announcement',
  initialAttachments = [],
  classes = [],
  formData,
  onFormDataChange,
  errors,
  onErrorsChange,
  isUploading,
  onUploadingChange,
}: ClassUpdateFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track initialization to prevent loops
  const initializedRef = useRef<string | null>(null);
  
  // Create a stable key from initial values (memoized to prevent unnecessary recalculations)
  const initialKey = useMemo(
    () => `${initialClassId || ''}-${initialTitle}-${initialContent}-${initialUpdateType}`,
    [initialClassId, initialTitle, initialContent, initialUpdateType]
  );
  
  // Initialize form data only when initial values change (not on every render)
  useEffect(() => {
    // Only initialize if the initial values key has changed
    if (initializedRef.current !== initialKey) {
      initializedRef.current = initialKey;
      onFormDataChange({
        classId: initialClassId || '',
        title: initialTitle,
        content: initialContent,
        updateType: initialUpdateType,
        existingAttachments: initialAttachments,
        uploadedAttachments: [],
      });
      setFiles([]);
      onErrorsChange({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};

    const totalAttachments = 
      formData.existingAttachments.length + 
      formData.uploadedAttachments.length + 
      files.length;

    selectedFiles.forEach((file) => {
      if (totalAttachments + validFiles.length >= MAX_FILES) {
        newErrors.files = `Maximum ${MAX_FILES} files allowed`;
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        newErrors.files = `File "${file.name}" exceeds 5MB limit`;
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
    onErrorsChange(newErrors);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index: number) => {
    onFormDataChange({
      existingAttachments: formData.existingAttachments.filter((_, i) => i !== index),
    });
  };

  const handleUploadFiles = async () => {
    if (!formData.classId) {
      onErrorsChange({ files: 'Please select a class first' });
      return;
    }

    if (files.length === 0) return;

    onUploadingChange(true);
    try {
      const attachments = await uploadAttachments(formData.classId, files);
      onFormDataChange({
        uploadedAttachments: [...formData.uploadedAttachments, ...attachments as AttachmentData[]],
      });
      setFiles([]);
      onErrorsChange({});
    } catch (error: unknown) {
      console.error('Failed to upload files:', error);
      const err = error as { message?: string; response?: { data?: { message?: string }; status?: number }; code?: string };
      const errorDetails = {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        code: err?.code,
        isTimeout: err?.code === 'ECONNABORTED',
      };
      console.error('Error details:', JSON.stringify(errorDetails, null, 2));
      
      let errorMessage = 'Failed to upload files. Please try again.';
      if (err?.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try with smaller files or check your connection.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      onErrorsChange({ files: errorMessage });
    } finally {
      onUploadingChange(false);
    }
  };

  const handleRemoveUploadedAttachment = (index: number) => {
    onFormDataChange({
      uploadedAttachments: formData.uploadedAttachments.filter((_, i) => i !== index),
    });
  };

  const totalAttachments = formData.existingAttachments.length + formData.uploadedAttachments.length;
  const canAddMoreFiles = totalAttachments < MAX_FILES;

  return (
    <div className="space-y-4">
      {/* Class Selection / Display */}
      <div className="space-y-2">
        <Label htmlFor="class">Class *</Label>
        {mode === 'create' ? (
          <>
            <Select 
              value={formData.classId} 
              onValueChange={(value) => onFormDataChange({ classId: value })}
            >
              <SelectTrigger className={errors.class ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class && <p className="text-xs text-red-500">{errors.class}</p>}
          </>
        ) : (
          <>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {initialClassName || 'Unknown Class'}
            </div>
            <p className="text-xs text-muted-foreground">Class cannot be changed</p>
          </>
        )}
      </div>

      {/* Update Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select 
          value={formData.updateType} 
          onValueChange={(value) => onFormDataChange({ updateType: value as 'announcement' | 'homework' | 'reminder' | 'event' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UPDATE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${type.color}`} />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="Enter a title for your update"
          value={formData.title}
          onChange={(e) => onFormDataChange({ title: e.target.value })}
          maxLength={255}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          placeholder={mode === 'create' ? "Write your update here... (Markdown supported)" : "Write your update here..."}
          value={formData.content}
          onChange={(e) => onFormDataChange({ content: e.target.value })}
          className={`min-h-[150px] ${errors.content ? 'border-red-500' : ''}`}
          maxLength={10000}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Supports basic Markdown formatting</span>
          <span>{formData.content.length}/10000</span>
        </div>
        {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
      </div>

      {/* Existing Attachments (Edit mode) */}
      {mode === 'edit' && formData.existingAttachments.length > 0 && (
        <div className="space-y-2">
          <Label>Current Attachments</Label>
          <div className="space-y-2">
            {formData.existingAttachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                {getFileIcon(getAttachmentMimeType(attachment))}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getAttachmentDisplayName(attachment)}
                  </p>
                  <p className="text-xs text-muted-foreground">{getAttachmentSizeFormatted(attachment)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveExistingAttachment(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload */}
      {canAddMoreFiles && (
        <div className="space-y-2">
          <Label>
            {mode === 'edit' ? `Add Attachments (${totalAttachments}/${MAX_FILES})` : 'Attachments'}
          </Label>
          <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || !canAddMoreFiles}
            />
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !canAddMoreFiles}
                >
                  Choose files
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Images, videos, documents (max {mode === 'edit' ? `${MAX_FILES - totalAttachments} more` : MAX_FILES} files, 5MB each)
                </p>
              </div>
            </div>
          </div>
          {errors.files && <p className="text-xs text-red-500">{errors.files}</p>}

          {/* Selected Files (Not Uploaded Yet) */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Files to upload ({files.length})</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUploadFiles}
                  disabled={isUploading || !formData.classId}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Files'
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Newly Uploaded Attachments */}
          {formData.uploadedAttachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600">
                {mode === 'edit' ? 'Newly uploaded attachments' : 'Uploaded attachments'} ({formData.uploadedAttachments.length})
              </p>
              <div className="space-y-2">
                {formData.uploadedAttachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    {getFileIcon(getAttachmentMimeType(attachment))}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getAttachmentDisplayName(attachment)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getAttachmentSizeFormatted(attachment)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Uploaded</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUploadedAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}
    </div>
  );
}

