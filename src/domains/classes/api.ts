import { http } from "@/core/http/axios";
import {
  Class,
  ClassWithDetails,
  CreateClassRequest,
  UpdateClassRequest,
  ClassFilters,
  ClassSubjectsResponse,
  ClassOfferingsResponse,
  ClassStudentsResponse,
} from "./types";

/**
 * Fetch all classes
 */
export async function fetchClasses(filters?: ClassFilters): Promise<Class[]> {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append("search", filters.search);
  if (filters?.grade_level) params.append("grade_level", filters.grade_level);
  if (filters?.academic_year) params.append("academic_year", filters.academic_year);
  if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active));
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const queryString = params.toString();
  const url = queryString ? `/classes?${queryString}` : "/classes";
  
  const res = await http().get(url);
  
  // Handle different response formats
  if (Array.isArray(res.data)) {
    return res.data as Class[];
  }
  if (res.data.classes) {
    return res.data.classes as Class[];
  }
  return res.data as Class[];
}

/**
 * Fetch a single class by ID
 */
export async function fetchClassById(classId: string): Promise<ClassWithDetails> {
  const res = await http().get(`/classes/${classId}`);
  return res.data as ClassWithDetails;
}

/**
 * Create a new class
 */
export async function createClass(data: CreateClassRequest): Promise<Class> {
  const res = await http().post("/classes", data);
  return res.data.class || res.data;
}

/**
 * Update a class
 */
export async function updateClass(
  classId: string,
  data: UpdateClassRequest
): Promise<Class> {
  const res = await http().put(`/classes/${classId}`, data);
  return res.data.class || res.data;
}

/**
 * Delete a class (soft delete by setting is_active to false)
 */
export async function deleteClass(classId: string): Promise<void> {
  await http().put(`/classes/${classId}`, { is_active: false });
}

/**
 * Fetch students in a class
 */
export async function fetchClassStudents(
  classId: string,
  params?: { page?: number; limit?: number; search?: string }
): Promise<ClassStudentsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.search) searchParams.append('search', params.search);

  const response = await http().get(
    `/classes/${classId}/students?${searchParams.toString()}`,
    {
      method: 'GET',
    }
  );

  return response.data;
}

/**
 * Check students enrollment in a class
 */
export async function checkStudentsEnrollment(
  classId: string,
  studentIds: string[]
): Promise<{ enrolled_students: Array<{ student_id: string; class_id: string; role_in_class: string; enrolled_at: string }> }> {
  const response = await http().post(`/classes/${classId}/students/check`, {
    student_ids: studentIds,
  });

  return response.data;
}

/**
 * Add (enroll) students to a class
 */
export async function addStudentsToClass(
  classId: string,
  studentIds: string[]
): Promise<{ added: string[]; already_enrolled: string[]; invalid: string[] }> {
  const response = await http().post(`/classes/${classId}/students`, {
    student_ids: studentIds,
  });

  return response.data;
}

/**
 * Remove (unenroll) a student from a class
 */
export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
  await http().delete(`/classes/${classId}/students/${studentId}`);
}

/**
 * Fetch teachers in a class
 */
export async function fetchClassTeachers(classId: string) {
  const res = await http().get(`/classes/${classId}/teachers`);
  return res.data;
}

/**
 * Fetch lessons for a class
 */
export async function fetchClassLessons(classId: string) {
  const res = await http().get(`/classes/${classId}/lessons`);
  return res.data;
}

/**
 * Fetch subjects for a class
 */
export async function fetchClassSubjects(classId: string): Promise<ClassSubjectsResponse> {
  const res = await http().get(`/classes/${classId}/subjects`);
  return res.data as ClassSubjectsResponse;
}

/**
 * Attach subjects to a class
 */
export async function addSubjectsToClass(
  classId: string,
  subjectIds: string[]
): Promise<{ added: string[]; already_added: string[]; invalid: string[] }> {
  const res = await http().post(`/classes/${classId}/subjects`, {
    subject_ids: subjectIds,
  });

  return res.data;
}

/**
 * Remove a subject from a class
 */
export async function removeClassSubject(classId: string, classSubjectId: string): Promise<void> {
  await http().delete(`/classes/${classId}/subjects/${classSubjectId}`);
}

/**
 * Fetch class offerings (subject-class combinations) for a class
 */
export async function fetchClassOfferings(
  classId: string,
  params?: { academic_period_id?: string }
): Promise<ClassOfferingsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.academic_period_id) {
    queryParams.append("academic_period_id", params.academic_period_id);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/classes/${classId}/offerings?${queryString}`
    : `/classes/${classId}/offerings`;

  const res = await http().get(url);
  return res.data as ClassOfferingsResponse;
}
