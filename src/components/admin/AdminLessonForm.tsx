"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useClasses, useClassSubjects } from "@/domains/classes/hooks";
import { useCreateLesson, useLesson, useUpdateLesson } from "@/domains/lessons/hooks";
import type { CreateLessonRequest, UpdateLessonRequest } from "@/domains/lessons/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminLessonFormProps {
  mode: "create" | "edit";
  lessonId?: string;
}

export function AdminLessonForm({ mode, lessonId }: AdminLessonFormProps) {
  const router = useRouter();
  const [classId, setClassId] = useState<string | undefined>(undefined);

  const { data: lesson, isLoading: isLessonLoading } = useLesson(mode === "edit" ? lessonId : undefined);
  const { data: classes, isLoading: isClassesLoading } = useClasses({ is_active: true });
  const { data: classSubjects, isLoading: isClassSubjectsLoading } = useClassSubjects(classId);

  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();

  const [formState, setFormState] = useState<{
    class_subject_id?: string;
    scheduled_start?: string;
    scheduled_end?: string;
    title?: string;
    description?: string;
    notes?: string;
  }>({});

  const isLoading =
    (mode === "edit" && isLessonLoading) ||
    isClassesLoading ||
    (classId ? isClassSubjectsLoading : false) ||
    createMutation.isPending ||
    updateMutation.isPending;

  useMemo(() => {
    if (mode === "edit" && lesson && !formState.class_subject_id) {
      setFormState({
        class_subject_id: lesson.class_subject_id,
        scheduled_start: lesson.scheduled_start?.slice(0, 16),
        scheduled_end: lesson.scheduled_end?.slice(0, 16),
        title: lesson.title ?? undefined,
        description: lesson.description ?? undefined,
        notes: lesson.notes ?? undefined,
      });
    }
  }, [mode, lesson, formState.class_subject_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.class_subject_id || !formState.scheduled_start || !formState.scheduled_end) {
      return;
    }

    const payloadBase: CreateLessonRequest | UpdateLessonRequest = {
      class_subject_id: formState.class_subject_id,
      scheduled_start: new Date(formState.scheduled_start).toISOString(),
      scheduled_end: new Date(formState.scheduled_end).toISOString(),
      title: formState.title,
      description: formState.description,
      notes: formState.notes,
    } as any;

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payloadBase as CreateLessonRequest);
      } else if (mode === "edit" && lessonId) {
        const { class_subject_id, ...updateData } = payloadBase as any;
        await updateMutation.mutateAsync({ id: lessonId, data: updateData as UpdateLessonRequest });
      }

      router.push("/admin/lessons");
    } catch (err) {
      // errors surfaced via mutation state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Select
            disabled={isLoading}
            value={classId}
            onValueChange={(value) => {
              setClassId(value);
              setFormState((prev) => ({ ...prev, class_subject_id: undefined }));
            }}
          >
            <SelectTrigger id="class" className="bg-white">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="class_subject">Subject / Teacher</Label>
          <Select
            disabled={isLoading || !classId}
            value={formState.class_subject_id}
            onValueChange={(value) => setFormState((prev) => ({ ...prev, class_subject_id: value }))}
          >
            <SelectTrigger id="class_subject" className="bg-white">
              <SelectValue placeholder={classId ? "Select subject" : "Select class first"} />
            </SelectTrigger>
            <SelectContent>
              {classSubjects?.subjects?.map((cs) => {
                const value = cs.class_subject_id ?? cs.subject_id;
                const subjectLabel = cs.subject_name ?? "Subject";
                const teacherName = cs.teacher
                  ? `${cs.teacher.first_name ?? ""} ${cs.teacher.last_name ?? ""}`.trim()
                  : "";
                return (
                  <SelectItem key={value} value={value}>
                    {subjectLabel} {teacherName ? `- ${teacherName}` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_start">Start time</Label>
          <Input
            id="scheduled_start"
            type="datetime-local"
            disabled={isLoading}
            className="bg-white"
            value={formState.scheduled_start ?? ""}
            onChange={(e) => setFormState((prev) => ({ ...prev, scheduled_start: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_end">End time</Label>
          <Input
            id="scheduled_end"
            type="datetime-local"
            disabled={isLoading}
            className="bg-white"
            value={formState.scheduled_end ?? ""}
            onChange={(e) => setFormState((prev) => ({ ...prev, scheduled_end: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          disabled={isLoading}
          className="bg-white"
          value={formState.title ?? ""}
          onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          disabled={isLoading}
          className="bg-white"
          value={formState.description ?? ""}
          onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          disabled={isLoading}
          className="bg-white"
          value={formState.notes ?? ""}
          onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => router.push("/admin/lessons")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {mode === "create" ? "Create lesson" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
