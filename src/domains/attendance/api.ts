import { http } from "@/core/http/axios";
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

export async function openAttendanceSession(
  classId: string,
  payload: { date: string; lesson_instance_id?: string }
): Promise<OpenAttendanceSessionResponse> {
  const res = await http().post(`/attendance/sessions/${classId}/open`, payload);
  return res.data as OpenAttendanceSessionResponse;
}

export async function bulkUpdateAttendance(
  classId: string,
  payload: BulkUpdateAttendanceRequestPayload
): Promise<BulkUpdateAttendanceResponse> {
  const res = await http().post(`/attendance/bulk-update/${classId}`, payload);
  return res.data as BulkUpdateAttendanceResponse;
}

export async function markStudentAttendance(
  classId: string,
  studentId: string,
  payload: MarkStudentAttendancePayload
): Promise<AttendanceRecord> {
  const res = await http().post(`/attendance/mark/${classId}/${studentId}`, payload);
  return (res.data as { record: AttendanceRecord }).record;
}

export async function getTeacherAttendanceStatus(
  date?: string
): Promise<TeacherAttendanceStatusResponse> {
  const res = await http().get("/attendance/teacher/status", {
    params: date ? { date } : undefined,
  });
  return res.data as TeacherAttendanceStatusResponse;
}

export async function submitTeacherAttendance(
  payload: TeacherAttendanceSubmitPayload
): Promise<TeacherAttendanceSubmitResponse> {
  const res = await http().post("/attendance/teacher/submit", payload);
  return res.data as TeacherAttendanceSubmitResponse;
}
