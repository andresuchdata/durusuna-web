import { http } from "@/core/http/axios";
import type {
  AdminLessonDashboardResponse,
  CreateLessonRequest,
  LessonDashboardQueryParams,
  LessonInstance,
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

export async function fetchAdminLessonsDashboard(
  params: LessonDashboardQueryParams = {}
): Promise<AdminLessonDashboardResponse> {
  const res = await http().get("/lessons/admin/lessons", { params });
  return res.data as AdminLessonDashboardResponse;
}
