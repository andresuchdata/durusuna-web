export type LessonAttendanceStatus = "not_started" | "in_progress" | "finalized";

export interface LessonContextClass {
  id: string;
  name: string;
  grade_level?: string | null;
  section?: string | null;
  academic_year?: string;
}

export interface LessonContextSubject {
  id: string;
  name: string;
  code?: string;
  category?: string | null;
}

export interface TeacherLessonSummary {
  id: string;
  class_subject_id: string;
  schedule_slot_id?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string | null;
  actual_end?: string | null;
  status: "planned" | "in_session" | "completed" | "cancelled";
  title?: string | null;
  description?: string | null;
  objectives: string[];
  materials: Record<string, unknown>[];
  notes?: string | null;
  cancellation_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class?: LessonContextClass;
  subject?: LessonContextSubject;
  class_name?: string;
  subject_name?: string;
  attendance_session_id?: string | null;
  attendance_status?: LessonAttendanceStatus;
}

export interface TeacherLessonDashboardResponse {
  date: string;
  lessons: TeacherLessonSummary[];
  total: number;
}

export interface UpdateLessonStatusPayload {
  status: "in_session" | "completed";
  actual_start?: string | null;
  actual_end?: string | null;
}
