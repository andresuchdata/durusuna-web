"use client";

import { useState } from "react";
import { useCreateClass } from "@/domains/classes/hooks";
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
import type { CreateClassRequest } from "@/domains/classes/types";
import { Loader2 } from "lucide-react";

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClassDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateClassDialogProps) {
  const createClass = useCreateClass();
  const [formData, setFormData] = useState<CreateClassRequest>({
    name: "",
    description: "",
    grade_level: "",
    section: "",
    academic_year: new Date().getFullYear().toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    }

    if (!formData.academic_year.trim()) {
      newErrors.academic_year = "Academic year is required";
    } else if (!/^\d{4}(-\d{4})?$/.test(formData.academic_year)) {
      newErrors.academic_year = "Format: YYYY or YYYY-YYYY (e.g., 2024 or 2024-2025)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createClass.mutateAsync(formData);
      onSuccess?.();
      onOpenChange(false);
      // Reset form
      setFormData({
        name: "",
        description: "",
        grade_level: "",
        section: "",
        academic_year: new Date().getFullYear().toString(),
      });
      setErrors({});
    } catch (error: any) {
      console.error("Failed to create class:", error);
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
    if (!createClass.isPending) {
      onOpenChange(false);
      // Reset form and errors after closing
      setTimeout(() => {
        setFormData({
          name: "",
          description: "",
          grade_level: "",
          section: "",
          academic_year: new Date().getFullYear().toString(),
        });
        setErrors({});
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Class</DialogTitle>
          <DialogDescription>
            Add a new class to your school. Fill in the details below.
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
                disabled={createClass.isPending}
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
                disabled={createClass.isPending}
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
                  disabled={createClass.isPending}
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
                  disabled={createClass.isPending}
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
                disabled={createClass.isPending}
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
              disabled={createClass.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createClass.isPending}>
              {createClass.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

