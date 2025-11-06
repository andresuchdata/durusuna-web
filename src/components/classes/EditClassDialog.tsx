"use client";

import { useState, useEffect } from "react";
import { useUpdateClass } from "@/domains/classes/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Class, UpdateClassRequest } from "@/domains/classes/types";
import { Loader2 } from "lucide-react";

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  classData: Class | null;
}

export function EditClassDialog({
  open,
  onOpenChange,
  onSuccess,
  classData,
}: EditClassDialogProps) {
  const updateClass = useUpdateClass();
  const [formData, setFormData] = useState<UpdateClassRequest>({
    name: "",
    description: "",
    grade_level: "",
    section: "",
    academic_year: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when classData changes
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || "",
        description: classData.description || "",
        grade_level: classData.grade_level || "",
        section: classData.section || "",
        academic_year: classData.academic_year || "",
      });
    }
  }, [classData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Class name is required";
    }

    if (!formData.academic_year?.trim()) {
      newErrors.academic_year = "Academic year is required";
    } else if (!/^\d{4}(-\d{4})?$/.test(formData.academic_year)) {
      newErrors.academic_year = "Format: YYYY or YYYY-YYYY (e.g., 2024 or 2024-2025)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classData || !validateForm()) {
      return;
    }

    try {
      await updateClass.mutateAsync({
        classId: classData.id,
        data: formData,
      });
      onSuccess?.();
      onOpenChange(false);
      setErrors({});
    } catch (error: any) {
      console.error("Failed to update class:", error);
      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      }
    }
  };

  const handleClose = () => {
    if (!updateClass.isPending) {
      onOpenChange(false);
      // Reset errors after closing
      setTimeout(() => {
        setErrors({});
      }, 200);
    }
  };

  if (!classData) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Class</DialogTitle>
          <DialogDescription>
            Update the class information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Class Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Class Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Mathematics 101"
                className={errors.name ? "border-red-500" : ""}
                disabled={updateClass.isPending}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the class"
                rows={3}
                className={errors.description ? "border-red-500" : ""}
                disabled={updateClass.isPending}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Grade Level and Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade_level" className="text-sm font-medium">
                  Grade Level
                </Label>
                <Input
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  className={errors.grade_level ? "border-red-500" : ""}
                  disabled={updateClass.isPending}
                />
                {errors.grade_level && (
                  <p className="text-sm text-red-500">{errors.grade_level}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="section" className="text-sm font-medium">
                  Section
                </Label>
                <Input
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g., A"
                  className={errors.section ? "border-red-500" : ""}
                  disabled={updateClass.isPending}
                />
                {errors.section && (
                  <p className="text-sm text-red-500">{errors.section}</p>
                )}
              </div>
            </div>

            {/* Academic Year */}
            <div className="space-y-2">
              <Label htmlFor="academic_year" className="text-sm font-medium">
                Academic Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="academic_year"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="e.g., 2024 or 2024-2025"
                className={errors.academic_year ? "border-red-500" : ""}
                disabled={updateClass.isPending}
              />
              {errors.academic_year && (
                <p className="text-sm text-red-500">{errors.academic_year}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateClass.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateClass.isPending}>
              {updateClass.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

