"use client";

import { useState } from "react";
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
}

export function CreateClassUpdateDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  classes = []
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

  const handleFormDataChange = (data: Partial<ClassUpdateFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.classId) newErrors.class = 'Please select a class';
    if (!formData.content.trim()) newErrors.content = 'Content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
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
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create class update:', error);
      setErrors({ submit: 'Failed to create update. Please try again.' });
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
