"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLesson, fetchLessonById, updateLesson } from "./api";
import type { CreateLessonRequest, LessonInstance, UpdateLessonRequest } from "./types";

export function useLesson(lessonId: string | undefined) {
  return useQuery<LessonInstance>({
    queryKey: ["lessons", lessonId],
    queryFn: () => fetchLessonById(lessonId!),
    enabled: !!lessonId,
    staleTime: 30_000,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonRequest) => createLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonRequest }) => updateLesson(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["lessons", variables.id] });
    },
  });
}
