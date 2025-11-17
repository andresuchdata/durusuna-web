export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceMarkedVia = "manual" | "gps" | "imported";

export interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string | null;
  notes?: string | null;
  marked_by?: string | null;
  marked_via: AttendanceMarkedVia;
  student_latitude?: number | null;
  student_longitude?: number | null;
  location_verified: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  lesson_instance_id?: string | null;
  teacher_id: string;
  session_date: string;
  opened_at: string;
  closed_at?: string | null;
  is_finalized: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at?: string | null;
}

export interface AttendanceStudentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  avatar_url?: string | null;
  student_id?: string | null;
  employee_id?: string | null;
}

export interface AttendanceStudent {
  id: string;
  user_id: string;
  class_id: string;
  role_in_class: string;
  enrolled_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: AttendanceStudentUser;
  attendance: AttendanceRecord | null;
}

export interface OpenAttendanceSessionResponse {
  message: string;
  session: AttendanceSession;
  students: AttendanceStudent[];
}

export interface BulkUpdateAttendanceRecordPayload {
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkUpdateAttendanceRequestPayload {
  date: string;
  records: BulkUpdateAttendanceRecordPayload[];
  marked_via?: "manual" | "gps";
}

export interface BulkUpdateAttendanceResponse {
  message: string;
  updated_count: number;
  records: AttendanceRecord[];
}

export interface FinalizeAttendanceResponse {
  message: string;
  session: AttendanceSession;
}

export interface StudentAttendanceHistoryResponse {
  history: AttendanceRecord[];
}

export interface MarkStudentAttendancePayload {
  date: string;
  status: AttendanceStatus;
  notes?: string;
  marked_via?: "manual" | "gps";
}

export interface TeacherAttendanceStatusResponse {
  attendance: AttendanceRecord | null;
  date: string;
}

export interface TeacherAttendanceSubmitPayload {
  date?: string;
  status: AttendanceStatus;
  notes?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  marked_via?: "manual" | "gps";
}

export interface TeacherAttendanceSubmitResponse {
  message: string;
  record: AttendanceRecord;
}
