export interface AdminDashboardLesson {
  id: string;
  title?: string | null;
  subject_name?: string | null;
  class_name?: string | null;
  teacher_name?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: "planned" | "in_session" | "completed" | "cancelled";
}

export interface AdminDashboardData {
  lessons: AdminDashboardLesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
