"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  bulkUpdateAttendance,
  getTeacherAttendanceStatus,
  markStudentAttendance,
  openAttendanceSession,
  submitTeacherAttendance,
} from "./api";
import type {
  AttendanceRecord,
  BulkUpdateAttendanceRequestPayload,
  BulkUpdateAttendanceResponse,
  MarkStudentAttendancePayload,
  OpenAttendanceSessionResponse,
  TeacherAttendanceStatusResponse,
  TeacherAttendanceSubmitPayload,
  TeacherAttendanceSubmitResponse,
} from "./types";

export function useOpenAttendanceSession(
  classId: string | undefined,
  date: string | undefined,
  lessonInstanceId?: string
) {
  return useQuery<OpenAttendanceSessionResponse>({
    queryKey: ["attendance", "session", classId, date, lessonInstanceId ?? null],
    queryFn: () => openAttendanceSession(classId!, { date: date!, lesson_instance_id: lessonInstanceId }),
    enabled: !!classId && !!date,
    staleTime: 30_000,
  });
}

export function useBulkUpdateAttendance() {
  return useMutation<
    BulkUpdateAttendanceResponse,
    unknown,
    { classId: string; payload: BulkUpdateAttendanceRequestPayload }
  >({
    mutationFn: ({ classId, payload }) => bulkUpdateAttendance(classId, payload),
  });
}

export function useMarkStudentAttendance() {
  return useMutation<
    AttendanceRecord,
    unknown,
    { classId: string; studentId: string; payload: MarkStudentAttendancePayload }
  >({
    mutationFn: ({ classId, studentId, payload }) => markStudentAttendance(classId, studentId, payload),
  });
}

export function useTeacherAttendanceStatus(date?: string) {
  return useQuery<TeacherAttendanceStatusResponse>({
    queryKey: ["attendance", "teacher", "status", date ?? "today"],
    queryFn: () => getTeacherAttendanceStatus(date),
    staleTime: 30_000,
  });
}

export function useSubmitTeacherAttendance() {
  return useMutation<TeacherAttendanceSubmitResponse, unknown, TeacherAttendanceSubmitPayload>({
    mutationFn: (payload) => submitTeacherAttendance(payload),
  });
}
