import { http } from "@/core/http/axios";

export interface AccessibleUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  school_id: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AccessUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'all' | 'teacher' | 'student' | 'parent';
  includeInactive?: boolean;
}

export interface AccessUsersResponse {
  success: boolean;
  data: {
    users: AccessibleUser[];
    pagination: {
      page: number;
      limit: number;
      hasMore: boolean;
      total: number;
    };
  };
}

export interface UserAccessResponse {
  success: boolean;
  data: {
    userId: string;
    canAccess: boolean;
    currentUserId: string;
  };
}

export interface ConversationParticipantsAccessResponse {
  success: boolean;
  data: {
    participantIds: string[];
    canAccessAll: boolean;
    accessibleParticipants: AccessibleUser[];
    accessibleCount: number;
    totalRequested: number;
  };
}

export interface UserTypesResponse {
  success: boolean;
  data: {
    userTypes: string[];
    currentUserType: string;
    currentUserRole: string;
  };
}

export interface UserPermissions {
  canViewAllUsers: boolean;
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  canAccessConversations: boolean;
  canCreateConversations: boolean;
  canManageSchool: boolean;
  canViewGrades: boolean;
  canManageClasses: boolean;
  accessibleUserTypes: string[];
  userType: string;
  role: string;
  schoolId: string;
}

export interface PermissionsResponse {
  success: boolean;
  data: UserPermissions;
}

/**
 * Get users accessible to the current user based on their role and relationships
 */
export async function getAccessibleUsers(params: AccessUsersParams = {}): Promise<AccessUsersResponse> {
  const { data } = await http().get("/access/users", { params });
  return data;
}

/**
 * Check if current user can access a specific user
 */
export async function canAccessUser(userId: string): Promise<UserAccessResponse> {
  const { data } = await http().get(`/access/user/${userId}`);
  return data;
}

/**
 * Check if current user can access conversation participants
 */
export async function checkConversationParticipantsAccess(
  participantIds: string[]
): Promise<ConversationParticipantsAccessResponse> {
  const { data } = await http().get("/access/conversation-participants", {
    params: { participantIds: participantIds.join(",") },
  });
  return data;
}

/**
 * Get user types that the current user can access
 */
export async function getAccessibleUserTypes(): Promise<UserTypesResponse> {
  const { data } = await http().get("/access/user-types");
  return data;
}

/**
 * Get current user's permissions and access levels
 */
export async function getUserPermissions(): Promise<PermissionsResponse> {
  const { data } = await http().get("/access/permissions");
  return data;
}
