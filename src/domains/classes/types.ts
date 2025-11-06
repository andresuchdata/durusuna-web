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

