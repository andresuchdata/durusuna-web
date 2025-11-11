"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { createClassUpdate, type CreateClassUpdateData } from "@/domains/class-updates/api";
import { ClassUpdateForm, type ClassUpdateFormData } from "./ClassUpdateForm";

interface CreateClassUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  classes?: Array<{ id: string; name: string }>;
  onOptimisticCreate?: (formData: ClassUpdateFormData, uploadProgress?: Record<string, number>) => string;
  onOptimisticProgressUpdate?: (updateId: string, fileId: string, progress: number) => void;
  onOptimisticRemove?: (updateId: string) => void;
}

export function CreateClassUpdateDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  classes = [],
  onOptimisticCreate,
  onOptimisticProgressUpdate,
  onOptimisticRemove
}: CreateClassUpdateDialogProps) {
  const [formData, setFormData] = useState<ClassUpdateFormData>({
    classId: '',
    title: '',
    content: '',
    updateType: 'announcement',
    existingAttachments: [],
    uploadedAttachments: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        classId: '',
        title: '',
        content: '',
        updateType: 'announcement',
        existingAttachments: [],
        uploadedAttachments: [],
      });
      setErrors({});
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleFormDataChange = useCallback((data: Partial<ClassUpdateFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const handleSubmit = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.classId) newErrors.class = 'Please select a class';
    if (!formData.content.trim()) newErrors.content = 'Content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Close dialog immediately for better UX
    onOpenChange(false);

    // Create optimistic update if handler is provided
    let optimisticId: string | undefined;
    if (onOptimisticCreate) {
      // Initialize progress for all uploaded attachments
      const initialProgress: Record<string, number> = {};
      formData.uploadedAttachments.forEach(att => {
        // Use multiple possible keys for consistency
        const possibleKeys = [
          att.id,
          att.fileName,
          att.originalName,
          (att.name || 'unknown') + att.size,
          att.size?.toString()
        ].filter(Boolean);
        
        // Set progress to 100% for all possible keys since files are already uploaded
        possibleKeys.forEach(key => {
          initialProgress[key as string] = 100;
        });
      });
      
      // If there are attachments, show them as uploading initially for visual feedback
      const hasAttachments = formData.uploadedAttachments.length > 0;
      optimisticId = onOptimisticCreate(formData, initialProgress);
    }

    setIsSubmitting(true);
    try {
      const data: CreateClassUpdateData = {
        class_id: formData.classId,
        title: formData.title.trim() || undefined,
        content: formData.content.trim(),
        update_type: formData.updateType,
        attachments: formData.uploadedAttachments,
      };

      await createClassUpdate(data);
      
      // Remove optimistic update after successful creation
      if (optimisticId && onOptimisticRemove) {
        setTimeout(() => {
          onOptimisticRemove(optimisticId!);
        }, 1000); // Small delay to allow real update to appear
      }
      
      // Reset form
      setFormData({
        classId: '',
        title: '',
        content: '',
        updateType: 'announcement',
        existingAttachments: [],
        uploadedAttachments: [],
      });
      setErrors({});
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create class update:', error);
      
      // Remove optimistic update on error
      if (optimisticId && onOptimisticRemove) {
        onOptimisticRemove(optimisticId);
      }
      
      setErrors({ submit: 'Failed to create update. Please try again.' });
      onOpenChange(true); // Reopen dialog on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Class Update</DialogTitle>
          <DialogDescription>
            Share an announcement, homework, reminder, or event with your class
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ClassUpdateForm
            mode="create"
            classes={classes}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
            onErrorsChange={setErrors}
            isUploading={isUploading}
            onUploadingChange={setIsUploading}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Update'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
