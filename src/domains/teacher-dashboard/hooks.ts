"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeacherDailyLessons,
  fetchTeacherLessonSummary,
  updateTeacherLessonStatus,
} from "./api";
import {
  TeacherLessonDashboardResponse,
  TeacherLessonSummary,
  UpdateLessonStatusPayload,
} from "./types";

export function useTeacherDailyLessons(date?: string) {
  return useQuery<TeacherLessonDashboardResponse>({
    queryKey: ["teacher", "lessons", "dashboard", date ?? "today"],
    queryFn: () => fetchTeacherDailyLessons(date),
    staleTime: 60_000,
  });
}

export function useTeacherLessonSummary(lessonId: string | undefined) {
  return useQuery<TeacherLessonSummary>({
    queryKey: ["teacher", "lessons", lessonId],
    queryFn: () => fetchTeacherLessonSummary(lessonId!),
    enabled: !!lessonId,
    staleTime: 30_000,
  });
}

export function useUpdateTeacherLessonStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, payload }: { lessonId: string; payload: UpdateLessonStatusPayload }) =>
      updateTeacherLessonStatus(lessonId, payload),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher", "lessons", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher", "lessons", data.id] }),
      ]);
    },
  });
}
