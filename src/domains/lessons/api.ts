import { http } from "@/core/http/axios";
import type {
  AdminLessonDashboardResponse,
  CreateLessonRequest,
  LessonDashboardQueryParams,
  LessonInstance,
  LessonInstanceStatus,
  LessonInstanceWithAttendance,
  UpdateLessonRequest,
} from "./types";

export async function fetchLessonById(id: string): Promise<LessonInstance> {
  const res = await http().get(`/lessons/${id}`);
  return res.data as LessonInstance;
}

export async function createLesson(data: CreateLessonRequest): Promise<LessonInstance> {
  const res = await http().post("/lessons", data);
  return res.data as LessonInstance;
}

export async function updateLesson(id: string, data: UpdateLessonRequest): Promise<LessonInstance> {
  const res = await http().patch(`/lessons/${id}`, data);
  return res.data as LessonInstance;
}

export async function deleteLesson(id: string): Promise<void> {
  await http().delete(`/lessons/${id}`);
}

export async function fetchAdminLessonsDashboard(
  params: LessonDashboardQueryParams = {}
): Promise<AdminLessonDashboardResponse> {
  const res = await http().get("/lessons/admin/lessons", { params });
  return res.data as AdminLessonDashboardResponse;
}

export async function fetchLessonInstancesByClass(
  classId: string,
  params?: { from?: string; to?: string; status?: LessonInstanceStatus }
): Promise<LessonInstance[]> {
  const res = await http().get(`/classes/${classId}/lessons/instances`, { params });
  return res.data as LessonInstance[];
}

export async function fetchLessonInstancesByClassWithAttendance(
  classId: string,
  userId: string,
  userRole: string,
  params?: { from?: string; to?: string; status?: LessonInstanceStatus }
): Promise<LessonInstanceWithAttendance[]> {
  const res = await http().get(`/classes/${classId}/lessons/instances/attendance`, { 
    params: { ...params, user_id: userId, user_role: userRole }
  });
  return res.data as LessonInstanceWithAttendance[];
}
