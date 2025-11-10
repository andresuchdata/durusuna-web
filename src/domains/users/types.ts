export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'teacher' | 'student' | 'parent' | 'admin';
  role: 'admin' | 'user';
  school_id: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  date_of_birth?: string | null;
  student_id?: string | null;
  employee_id?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type UserListResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
};

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'all' | 'teacher' | 'student' | 'parent' | 'admin';
  isActive?: boolean;
  dobFrom?: string;
  dobTo?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
};

export type CreateUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'teacher' | 'student' | 'parent';
  role?: 'admin' | 'user';
  phone?: string;
  avatar_url?: string;
  password: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>> & {
  password?: string;
  is_active?: boolean;
};

export type BatchCreateUsersPayload = {
  users: CreateUserPayload[];
};

export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  user_type?: 'teacher' | 'student' | 'parent' | 'admin';
  role?: 'admin' | 'user';
  school_id?: string | null;
  is_active?: boolean;
  last_active_at?: string | null;
};

export type ContactsResponse = {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  totalContacts: number;
};

export type GetContactsParams = {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'all' | 'teacher' | 'student' | 'parent' | 'admin';
};

