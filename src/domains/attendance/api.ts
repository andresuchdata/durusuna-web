import { http } from "@/core/http/axios";
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

export async function fetchParentChildren(): Promise<{ id: string; first_name: string; last_name: string; email: string; avatar_url: string | null }[]> {
  const res = await http().get("/users/children");
  return res.data.children;
}

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

export async function finalizeAttendanceSession(
  classId: string,
  payload: { date: string }
): Promise<FinalizeAttendanceResponse> {
  const res = await http().post(`/attendance/sessions/${classId}/finalize`, payload);
  return res.data as FinalizeAttendanceResponse;
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

export async function fetchStudentAttendanceHistory(
  studentId: string,
  classId: string
): Promise<StudentAttendanceHistoryResponse> {
  const res = await http().get(`/attendance/student/${studentId}/history`, {
    params: { class_id: classId },
  });
  return res.data as StudentAttendanceHistoryResponse;
}
