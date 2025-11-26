import { http } from "@/core/http/axios";
import {
  TeacherLessonDashboardResponse,
  TeacherLessonSummary,
  UpdateLessonStatusPayload,
} from "./types";

export async function fetchTeacherDailyLessons(date?: string): Promise<TeacherLessonDashboardResponse> {
  const res = await http().get("/dashboard/lessons", {
    params: date ? { date } : undefined,
  });
  return res.data as TeacherLessonDashboardResponse;
}

export async function fetchTeacherLessonSummary(lessonId: string): Promise<TeacherLessonSummary> {
  const res = await http().get(`/lessons/teacher/lessons/${lessonId}`);
  return res.data as TeacherLessonSummary;
}

export async function updateTeacherLessonStatus(
  lessonId: string,
  payload: UpdateLessonStatusPayload,
): Promise<TeacherLessonSummary> {
  const res = await http().post(`/lessons/teacher/lessons/${lessonId}/status`, payload);
  return res.data.lesson as TeacherLessonSummary;
}
