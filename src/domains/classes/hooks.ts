"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchClasses,
  fetchClassById,
  createClass,
  updateClass,
  deleteClass,
  fetchClassStudents,
  checkStudentsEnrollment,
  fetchClassTeachers,
  fetchClassLessons,
  fetchClassSubjects,
  fetchClassOfferings,
  addStudentsToClass,
  removeStudentFromClass,
  addSubjectsToClass,
  removeClassSubject,
} from "./api";
import type {
  Class,
  ClassWithDetails,
  CreateClassRequest,
  UpdateClassRequest,
  ClassFilters,
  ClassSubjectsResponse,
  ClassOfferingsResponse,
} from "./types";

/**
 * Hook to fetch all classes
 */
export function useClasses(filters?: ClassFilters) {
  return useQuery<Class[]>({
    queryKey: ["classes", filters],
    queryFn: () => fetchClasses(filters),
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch a single class by ID
 */
export function useClass(classId: string | undefined) {
  return useQuery<ClassWithDetails>({
    queryKey: ["classes", classId],
    queryFn: () => fetchClassById(classId!),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

/**
 * Hook to create a new class
 */
export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassRequest) => createClass(data),
    onSuccess: () => {
      // Invalidate all classes queries using predicate for more reliable invalidation
      qc.invalidateQueries({
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === 'classes';
        }
      });
    },
  });
}

/**
 * Hook to update a class
 */
export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: UpdateClassRequest }) =>
      updateClass(classId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}

/**
 * Hook to delete a class
 */
export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => deleteClass(classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

/**
 * Hook to fetch students in a class
 */
export function useClassStudents(
  classId: string | undefined,
  params?: { page?: number; limit?: number; search?: string }
) {
  return useQuery({
    queryKey: ["classes", classId, "students", params],
    queryFn: () => fetchClassStudents(classId!, params),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

/**
 * Hook to check specific students' enrollment in a class
 */
export function useCheckStudentsEnrollment(
  classId: string | undefined,
  studentIds: string[] | undefined
) {
  return useQuery({
    queryKey: ["classes", classId, "students", "check", studentIds],
    queryFn: () => checkStudentsEnrollment(classId!, studentIds!),
    enabled: !!classId && !!studentIds && studentIds.length > 0,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch teachers in a class
 */
export function useClassTeachers(classId: string | undefined) {
  return useQuery({
    queryKey: ["classes", classId, "teachers"],
    queryFn: () => fetchClassTeachers(classId!),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch lessons for a class
 */
export function useClassLessons(classId: string | undefined) {
  return useQuery({
    queryKey: ["classes", classId, "lessons"],
    queryFn: () => fetchClassLessons(classId!),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch subjects for a class
 */
export function useClassSubjects(classId: string | undefined) {
  return useQuery<ClassSubjectsResponse>({
    queryKey: ["classes", classId, "subjects"],
    queryFn: () => fetchClassSubjects(classId!),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch class offerings for a class
 */
export function useClassOfferings(classId: string | undefined, academicPeriodId?: string) {
  return useQuery<ClassOfferingsResponse>({
    queryKey: ["classes", classId, "offerings", academicPeriodId ?? "all"],
    queryFn: () =>
      fetchClassOfferings(
        classId!,
        academicPeriodId ? { academic_period_id: academicPeriodId } : undefined
      ),
    enabled: !!classId && !!academicPeriodId,
    staleTime: 30_000,
  });
}

/**
 * Hook to add students to a class
 */
export function useAddStudentsToClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentIds }: { classId: string; studentIds: string[] }) =>
      addStudentsToClass(classId, studentIds),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["classes", variables.classId, "students"] });
      qc.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}

/**
 * Hook to remove a student from a class
 */
export function useRemoveStudentFromClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      removeStudentFromClass(classId, studentId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["classes", variables.classId, "students"] });
      qc.invalidateQueries({ queryKey: ["classes", variables.classId] });
    },
  });
}

/**
 * Hook to add subjects to a class
 */
export function useAddSubjectsToClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) =>
      addSubjectsToClass(classId, subjectIds),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["classes", variables.classId, "subjects"] });
    },
  });
}

/**
 * Hook to remove a subject from a class
 */
export function useRemoveClassSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, classSubjectId }: { classId: string; classSubjectId: string }) =>
      removeClassSubject(classId, classSubjectId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["classes", variables.classId, "subjects"] });
    },
  });
}
