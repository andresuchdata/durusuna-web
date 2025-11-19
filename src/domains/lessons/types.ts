export interface LessonInstance {
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
}

export interface LessonInstanceWithContext extends LessonInstance {
  class?: {
    id: string;
    name: string;
    grade_level?: string | null;
    section?: string | null;
    academic_year: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    category?: string | null;
  };
  primary_teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface LessonInstanceWithAttendance extends LessonInstanceWithContext {
  attendance_status?: 'present' | 'absent' | 'late' | 'excused' | 'not_taken';
}

export interface CreateLessonRequest {
  class_subject_id: string;
  scheduled_start: string;
  scheduled_end: string;
  schedule_slot_id?: string;
  title?: string;
  description?: string;
  objectives?: string[];
  materials?: Record<string, unknown>[];
  notes?: string;
}

export interface UpdateLessonRequest {
  scheduled_start?: string;
  scheduled_end?: string;
  schedule_slot_id?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  status?: "planned" | "in_session" | "completed" | "cancelled";
  title?: string | null;
  description?: string | null;
  objectives?: string[];
  materials?: Record<string, unknown>[];
  notes?: string | null;
  cancellation_reason?: string | null;
}

export type LessonInstanceStatus = LessonInstance["status"];

export interface AdminLessonSummary {
  id: string;
  class_id?: string | null;
  subject_id?: string | null;
  teacher_id?: string | null;
  title?: string | null;
  subject_name?: string | null;
  class_name?: string | null;
  teacher_name?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: LessonInstanceStatus;
}

export interface AdminLessonDashboardResponse {
  lessons: AdminLessonSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface LessonDashboardQueryParams {
  status?: LessonInstanceStatus;
  from?: string;
  to?: string;
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}
