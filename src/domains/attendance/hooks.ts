"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  bulkUpdateAttendance,
  getTeacherAttendanceStatus,
  markStudentAttendance,
  openAttendanceSession,
  finalizeAttendanceSession,
  fetchStudentAttendanceHistory,
  submitTeacherAttendance,
} from "./api";
import type {
  AttendanceRecord,
  BulkUpdateAttendanceRequestPayload,
  BulkUpdateAttendanceResponse,
  FinalizeAttendanceResponse,
  MarkStudentAttendancePayload,
  OpenAttendanceSessionResponse,
  StudentAttendanceHistoryResponse,
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

export function useStudentAttendanceHistory(
  studentId: string | undefined,
  classId: string | undefined
) {
  return useQuery<StudentAttendanceHistoryResponse>({
    queryKey: ["attendance", "student", studentId, "history", classId],
    queryFn: () => fetchStudentAttendanceHistory(studentId!, classId!),
    enabled: !!studentId && !!classId,
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

export function useTeacherAttendanceStatus(date: string | undefined) {
  return useQuery<TeacherAttendanceStatusResponse>({
    queryKey: ["attendance", "teacher", "status", date ?? "today"],
    queryFn: () => getTeacherAttendanceStatus(date),
    enabled: !!date,
    staleTime: 30_000,
  });
}

export function useSubmitTeacherAttendance() {
  return useMutation<TeacherAttendanceSubmitResponse, unknown, TeacherAttendanceSubmitPayload>({
    mutationFn: (payload) => submitTeacherAttendance(payload),
  });
}

export function useFinalizeAttendanceSession() {
  return useMutation<
    FinalizeAttendanceResponse,
    unknown,
    { classId: string; payload: { date: string } }
  >({
    mutationFn: ({ classId, payload }) => finalizeAttendanceSession(classId, payload),
  });
}
