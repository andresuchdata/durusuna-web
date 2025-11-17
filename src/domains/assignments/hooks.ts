"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssignmentForClassSubject,
  fetchAssignmentDetails,
  fetchTeacherAccessibleClasses,
  fetchTeacherAccessibleSubjects,
  fetchUserAssignments,
} from "./api";
import type {
  AssignmentDetailsResponse,
  AssignmentListQueryParams,
  AssignmentsListResponse,
  CreateAssignmentPayload,
  TeacherAccessibleClassesResponse,
  TeacherAccessibleSubjectsResponse,
} from "./types";

export function useUserAssignments(params: AssignmentListQueryParams | undefined) {
  return useQuery<AssignmentsListResponse>({
    queryKey: [
      "assignments",
      params?.page ?? 1,
      params?.limit ?? 50,
      params?.type ?? "all",
      params?.status ?? "published",
      params?.search ?? null,
      params?.subject_id ?? null,
      params?.class_id ?? null,
      params?.academic_period_id ?? null,
    ],
    queryFn: () => fetchUserAssignments(params ?? {}),
    enabled: !!params,
    staleTime: 30_000,
  });
}

export function useAssignmentDetails(assignmentId: string | undefined) {
  return useQuery<AssignmentDetailsResponse>({
    queryKey: ["assignments", assignmentId, "details"],
    queryFn: () => fetchAssignmentDetails(assignmentId!),
    enabled: !!assignmentId,
    staleTime: 30_000,
  });
}

export function useTeacherAccessibleSubjects(enabled: boolean = true) {
  return useQuery<TeacherAccessibleSubjectsResponse>({
    queryKey: ["assignments", "teacher", "subjects"],
    queryFn: fetchTeacherAccessibleSubjects,
    staleTime: 60_000,
    enabled,
  });
}

export function useTeacherAccessibleClasses(enabled: boolean = true) {
  return useQuery<TeacherAccessibleClassesResponse>({
    queryKey: ["assignments", "teacher", "classes"],
    queryFn: fetchTeacherAccessibleClasses,
    staleTime: 60_000,
    enabled,
  });
}

export function useCreateAssignmentForClassSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      classId: string;
      subjectId: string;
      payload: CreateAssignmentPayload;
    }) =>
      createAssignmentForClassSubject(args.classId, args.subjectId, args.payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}
