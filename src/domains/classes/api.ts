import { http } from "@/core/http/axios";
import type {
  Class,
  ClassWithDetails,
  CreateClassRequest,
  UpdateClassRequest,
  ClassFilters,
  ClassesResponse,
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
) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  const url = queryString 
    ? `/classes/${classId}/students?${queryString}` 
    : `/classes/${classId}/students`;
  
  const res = await http().get(url);
  return res.data;
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

