export interface Class {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  grade_level?: string;
  section?: string;
  academic_year: string;
  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ClassWithDetails extends Class {
  student_count?: number;
  teacher_count?: number;
  teachers?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    role_in_class?: string;
  }>;
  students?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    student_id?: string;
    role_in_class?: string;
  }>;
}

export interface CreateClassRequest {
  name: string;
  description?: string;
  grade_level?: string;
  section?: string;
  academic_year: string;
  settings?: Record<string, any>;
}

export interface UpdateClassRequest {
  name?: string;
  description?: string;
  grade_level?: string;
  section?: string;
  academic_year?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface ClassFilters {
  page?: number;
  limit?: number;
  search?: string;
  grade_level?: string;
  academic_year?: string;
  is_active?: boolean;
}

export interface ClassesResponse {
  classes: Class[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ClassLesson {
  id: string;
  title: string;
  content?: string;
  lesson_date?: string;
  duration_minutes?: number;
  status?: string;
}

export interface ClassSubject {
  class_subject_id?: string;
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  subject_description?: string;
  hours_per_week?: number;
  classroom?: string | null;
  schedule?: Record<string, any> | null;
  teacher?: {
    id?: string | null;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  lessons?: ClassLesson[];
}

export interface ClassSubjectsResponse {
  subjects: ClassSubject[];
}

export interface ClassOfferingSummary {
  class_offering_id: string;
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  subject_description?: string;
  hours_per_week?: number;
  room?: string | null;
  schedule?: Record<string, any> | null;
  teacher?: {
    id?: string | null;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

export interface ClassOfferingsResponse {
  offerings: ClassOfferingSummary[];
}

