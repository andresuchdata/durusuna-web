"use client";

import { useState, useEffect } from "react";
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
import { updateClassUpdate } from "@/domains/class-updates/api";
import type { ClassUpdate } from "@/domains/class-updates/types";
import { ClassUpdateForm, type ClassUpdateFormData } from "./ClassUpdateForm";

interface EditClassUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  update: ClassUpdate;
}

type AttachmentData = {
  id: string;
  originalName?: string;
  name?: string;
  fileName?: string;
  mimeType?: string;
  type?: string;
  size: number;
  url: string;
  key?: string;
  sizeFormatted?: string;
};

export function EditClassUpdateDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  update
}: EditClassUpdateDialogProps) {
  const [formData, setFormData] = useState<ClassUpdateFormData>({
    classId: update.classId || '',
    title: update.title || '',
    content: update.content,
    updateType: update.updateType || 'announcement',
    existingAttachments: (update.attachments || []) as AttachmentData[],
    uploadedAttachments: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when update changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        classId: update.classId || '',
        title: update.title || '',
        content: update.content,
        updateType: update.updateType || 'announcement',
        existingAttachments: (update.attachments || []) as AttachmentData[],
        uploadedAttachments: [],
      });
      setErrors({});
    }
  }, [open, update]);

  const handleFormDataChange = (data: Partial<ClassUpdateFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.content.trim()) newErrors.content = 'Content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine existing and newly uploaded attachments
      const allAttachments: AttachmentData[] = [
        ...formData.existingAttachments, 
        ...formData.uploadedAttachments
      ];

      await updateClassUpdate(update.id, {
        title: formData.title.trim() || undefined,
        content: formData.content.trim(),
        update_type: formData.updateType,
        attachments: allAttachments as never,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update class update:', error);
      setErrors({ submit: 'Failed to update. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class Update</DialogTitle>
          <DialogDescription>
            Update your announcement, homework, reminder, or event
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ClassUpdateForm
            mode="edit"
            initialClassId={update.classId}
            initialClassName={update.className}
            initialTitle={update.title}
            initialContent={update.content}
            initialUpdateType={update.updateType}
            initialAttachments={(update.attachments || []) as AttachmentData[]}
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
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
