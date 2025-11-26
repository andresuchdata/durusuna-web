"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  createLesson, 
  deleteLesson, 
  fetchAdminLessonsDashboard, 
  fetchLessonById, 
  fetchLessonInstancesByClass, 
  fetchLessonInstancesByClassWithAttendance, 
  updateLesson 
} from "./api";
import type {
  AdminLessonDashboardResponse,
  CreateLessonRequest,
  LessonDashboardQueryParams,
  LessonInstance,
  LessonInstanceWithAttendance,
  UpdateLessonRequest,
} from "./types";

export function useLesson(lessonId: string | undefined) {
  return useQuery<LessonInstance>({
    queryKey: ["lessons", lessonId],
    queryFn: () => fetchLessonById(lessonId!),
    enabled: !!lessonId,
    staleTime: 30_000,
  });
}

export function useAdminLessonsDashboard(params: LessonDashboardQueryParams = {}) {
  return useQuery<AdminLessonDashboardResponse>({
    queryKey: [
      "admin-lessons-dashboard",
      params.status ?? null,
      params.from ?? null,
      params.to ?? null,
      params.class_id ?? null,
      params.subject_id ?? null,
      params.teacher_id ?? null,
      params.search ?? null,
      params.page ?? null,
      params.limit ?? null,
    ],
    queryFn: () => fetchAdminLessonsDashboard(params),
    staleTime: 30_000,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonRequest) => createLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["admin-lessons-dashboard"] });
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
      qc.invalidateQueries({ queryKey: ["admin-lessons-dashboard"] });
    },
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["admin-lessons-dashboard"] });
    },
  });
}

export function useLessonInstancesByClass(
  classId: string | undefined,
  params?: { from?: string; to?: string; status?: LessonInstance["status"] }
) {
  return useQuery<LessonInstance[]>({
    queryKey: ["lesson-instances", "class", classId, params],
    queryFn: () => fetchLessonInstancesByClass(classId!, params),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

export function useLessonInstancesByClassWithAttendance(
  classId: string | undefined,
  userId: string | undefined,
  userRole: string | undefined,
  params?: { from?: string; to?: string; status?: LessonInstance["status"] }
) {
  return useQuery<LessonInstanceWithAttendance[]>({
    queryKey: ["lesson-instances", "class", classId, "attendance", userId, userRole, params],
    queryFn: () => fetchLessonInstancesByClassWithAttendance(classId!, userId!, userRole!, params),
    enabled: !!classId && !!userId && !!userRole,
    staleTime: 30_000,
  });
}
