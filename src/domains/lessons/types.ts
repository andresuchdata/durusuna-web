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
  page?: number;
  limit?: number;
}
