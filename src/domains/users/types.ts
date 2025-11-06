export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  user_type: 'teacher' | 'student' | 'parent';
  avatar_url?: string;
  school_id?: string;
};

export type ContactsResponse = {
  contacts: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type GetContactsParams = {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'all' | 'teacher' | 'student' | 'parent';
};

