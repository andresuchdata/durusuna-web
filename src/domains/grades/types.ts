export type AssessmentType = "assignment" | "test" | "final_exam";

export type AssessmentGradeStatus =
  | "not_submitted"
  | "submitted"
  | "graded"
  | "returned"
  | "excused";

export interface AssessmentSummary {
  id: string;
  class_offering_id: string;
  type: AssessmentType;
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
  grades_count?: number;
  submitted_count?: number;
  graded_count?: number;
  average_score?: number;
}

export interface AssessmentsResponse {
  assessments: AssessmentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AssessmentGradeSummary {
  id: string;
  assessment_id: string;
  student_id: string;
  score?: number | null;
  adjusted_score?: number | null;
  status: AssessmentGradeStatus;
  submitted_at?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  feedback?: string | null;
  rubric_scores?: Record<string, unknown> | null;
  is_late: boolean;
  days_late?: number | null;
  attachments?: unknown[];
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    student_id?: string | null;
    avatar_url?: string | null;
  };
}

export interface AssessmentGradesResponse {
  grades: AssessmentGradeSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AssessmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  class_offering_id?: string;
  type?: AssessmentType;
  group_tag?: string;
  is_published?: boolean;
}

export interface AssessmentGradesQueryParams {
  page?: number;
  limit?: number;
  assessment_id?: string;
  student_id?: string;
  status?: AssessmentGradeStatus;
  is_late?: boolean;
}

export interface CreateAssessmentPayload {
  class_offering_id: string;
  type: AssessmentType;
  title: string;
  description?: string;
  max_score: number;
  weight_override?: number;
  group_tag?: string;
  sequence_no?: number;
  assigned_date?: string;
  due_date?: string;
  rubric?: Record<string, unknown>;
  instructions?: Record<string, unknown>;
  allow_late_submission?: boolean;
  late_penalty_per_day?: number;
}

export interface UpdateAssessmentPayload {
  title?: string;
  description?: string;
  max_score?: number;
  weight_override?: number;
  group_tag?: string;
  sequence_no?: number;
  assigned_date?: string;
  due_date?: string;
  rubric?: Record<string, unknown>;
  instructions?: Record<string, unknown>;
  is_published?: boolean;
  allow_late_submission?: boolean;
  late_penalty_per_day?: number;
}

export type PromotionStatus = "promoted" | "not_promoted" | "conditional" | null;

export interface ReportCardStudent {
  id: string;
  first_name: string;
  last_name: string;
  student_number?: string | null;
}

export interface ReportCardSummary {
  id: string;
  student_id: string;
  class_id: string;
  academic_period_id: string;
  homeroom_teacher_id?: string | null;
  promotion_status?: PromotionStatus;
  is_published: boolean;
  is_locked: boolean;
  generated_at: string;
  finalized_at?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
  general_remark?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  student?: ReportCardStudent;
}

export interface ReportCardsListParams {
  class_id: string;
  academic_period_id: string;
  student_id?: string;
  page?: number;
  limit?: number;
}

export interface ReportCardsListResponse {
  report_cards: ReportCardSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ReportCardSubject {
  id: string;
  report_card_id: string;
  class_offering_id: string;
  final_grade_id?: string | null;
  subject_id: string;
  subject_name: string;
  subject_code?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  numeric_grade?: number | null;
  letter_grade?: string | null;
  is_passing?: boolean | null;
  sequence?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ReportCardDetail extends ReportCardSummary {
  class?: {
    id: string;
    name: string;
    grade_level?: string | null;
    section?: string | null;
  };
  academic_period?: {
    id: string;
    name: string;
    sequence: number;
  };
  academic_year?: {
    id: string;
    name: string;
  };
  subjects: ReportCardSubject[];
}

export interface GenerateReportCardsPayload {
  class_id: string;
  academic_period_id: string;
  student_ids?: string[];
  regenerate?: boolean;
}

export interface GenerateReportCardsResponse {
  report_cards: ReportCardSummary[];
  generated_count: number;
}
