export type AssignmentType = "assignment" | "test" | "final_exam";

export type AssignmentStatus =
  | "not_submitted"
  | "submitted"
  | "graded"
  | "returned"
  | "excused";

export interface AssignmentSummary {
  id: string;
  class_offering_id: string;
  type: AssignmentType;
  title: string;
  description?: string | null;
  max_score: number;
  weight_override?: number | null;
  group_tag?: string | null;
  sequence_no?: number | null;
  assigned_date?: string | null;
  due_date?: string | null;
  rubric?: Record<string, unknown> | null;
  instructions?: Record<string, unknown> | null;
  is_published: boolean;
  allow_late_submission: boolean;
  late_penalty_per_day?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  subject_name?: string | null;
  subject_code?: string | null;
  class_name?: string | null;
  creator_first_name?: string | null;
  creator_last_name?: string | null;
  submitted_count?: number | null;
  total_students?: number | null;
  grades_count?: number | null;
  graded_count?: number | null;
  average_score?: number | null;
  submission_status?: AssignmentStatus | null;
  student_score?: number | null;
  is_late?: boolean | null;
  submitted_at?: string | null;
  graded_at?: string | null;
}

export interface AssignmentsListResponse {
  assignments: AssignmentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssignmentListQueryParams {
  page?: number;
  limit?: number;
  type?: AssignmentType | "all";
  status?: "all" | "published" | "draft";
  search?: string;
  subject_id?: string;
  class_id?: string;
  academic_period_id?: string;
}

export interface AssignmentDetailsStudentSubmission {
  student_id: string;
  student_name: string;
  student_number?: string | null;
  avatar_url?: string | null;
  status: AssignmentStatus;
  score?: number | null;
  max_score: number;
  submitted_at?: string | null;
  graded_at?: string | null;
  grader_name?: string | null;
  is_late: boolean;
  days_late?: number | null;
  feedback?: string | null;
  submission_attachments: unknown[];
}

export interface AssignmentDetailsStats {
  total_students: number;
  submitted_count: number;
  graded_count: number;
  average_score?: number | null;
}

export interface AssignmentDetailsResponse {
  assignment: {
    id: string;
    class_offering_id: string;
    type: AssignmentType;
    title: string;
    description?: string | null;
    max_score: number;
    weight_override?: number | null;
    group_tag?: string | null;
    sequence_no?: number | null;
    assigned_date?: string | null;
    due_date?: string | null;
    rubric?: Record<string, unknown> | null;
    instructions?: Record<string, unknown> | null;
    is_published: boolean;
    allow_late_submission: boolean;
    late_penalty_per_day?: number | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    subject_name?: string | null;
    subject_code?: string | null;
    class_name?: string | null;
    class_id?: string | null;
    creator_name?: string | null;
  };
  attachments: unknown[];
  student_submissions: AssignmentDetailsStudentSubmission[];
  stats: AssignmentDetailsStats;
}

export interface TeacherAccessibleSubjectClass {
  class_id: string;
  class_name: string;
  grade_level?: string | null;
  class_offering_id?: string | null;
}

export interface TeacherAccessibleSubject {
  subject_id: string;
  subject_name: string;
  subject_code?: string | null;
  subject_description?: string | null;
  classes: TeacherAccessibleSubjectClass[];
}

export interface TeacherAccessibleSubjectsResponse {
  subjects: TeacherAccessibleSubject[];
  total: number;
}

export interface TeacherAccessibleClassSummary {
  class_id: string;
  class_name: string;
  grade_level?: string | null;
  class_offering_id?: string | null;
}

export interface TeacherAccessibleClassesResponse {
  classes: TeacherAccessibleClassSummary[];
  total: number;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  max_score: number;
  type: AssignmentType;
  assigned_date?: string;
  due_date?: string;
  rubric?: Record<string, unknown>;
  instructions?: Record<string, unknown>;
  allow_late_submission?: boolean;
  late_penalty_per_day?: number;
  is_published?: boolean;
}

export interface CreateAssignmentResponse {
  assignment: AssignmentSummary;
}
