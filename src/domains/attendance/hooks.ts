"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchParentChildren,
  openAttendanceSession, 
  bulkUpdateAttendance, 
  markStudentAttendance, 
  getTeacherAttendanceStatus, 
  submitTeacherAttendance, 
  finalizeAttendanceSession, 
  fetchStudentAttendanceHistory 
} from "./api";
import type { 
  AttendanceRecord, 
  AttendanceSession, 
  OpenAttendanceSessionResponse,
  BulkUpdateAttendanceRecordPayload,
  BulkUpdateAttendanceRequestPayload,
  BulkUpdateAttendanceResponse,
  MarkStudentAttendancePayload,
  TeacherAttendanceStatusResponse,
  TeacherAttendanceSubmitPayload,
  TeacherAttendanceSubmitResponse,
  FinalizeAttendanceResponse,
  StudentAttendanceHistoryResponse
} from "./types";

export function useParentChildren() {
  return useQuery({
    queryKey: ["parent", "children"],
    queryFn: fetchParentChildren,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

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
