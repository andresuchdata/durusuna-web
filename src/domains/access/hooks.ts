import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  getAccessibleUsers,
  canAccessUser,
  checkConversationParticipantsAccess,
  getAccessibleUserTypes,
  getUserPermissions,
  type AccessUsersParams,
  type AccessUsersResponse,
  type UserAccessResponse,
  type ConversationParticipantsAccessResponse,
  type UserTypesResponse,
  type PermissionsResponse,
} from "./api";

/**
 * Hook to get users accessible to the current user
 */
export function useAccessibleUsers(
  params: AccessUsersParams = {},
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
): UseQueryResult<AccessUsersResponse> {
  return useQuery({
    queryKey: ["accessibleUsers", params],
    queryFn: () => getAccessibleUsers(params),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if current user can access a specific user
 */
export function useCanAccessUser(
  userId: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<UserAccessResponse> {
  return useQuery({
    queryKey: ["canAccessUser", userId],
    queryFn: () => canAccessUser(userId),
    enabled: options?.enabled !== false && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (access doesn't change frequently)
  });
}

/**
 * Hook to check conversation participants access
 */
export function useConversationParticipantsAccess(
  participantIds: string[],
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<ConversationParticipantsAccessResponse> {
  return useQuery({
    queryKey: ["conversationParticipantsAccess", participantIds],
    queryFn: () => checkConversationParticipantsAccess(participantIds),
    enabled: options?.enabled !== false && participantIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get accessible user types
 */
export function useAccessibleUserTypes(
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<UserTypesResponse> {
  return useQuery({
    queryKey: ["accessibleUserTypes"],
    queryFn: getAccessibleUserTypes,
    enabled: options?.enabled !== false,
    staleTime: 15 * 60 * 1000, // 15 minutes (user types don't change frequently)
  });
}

/**
 * Hook to get current user's permissions
 */
export function useUserPermissions(
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<PermissionsResponse> {
  return useQuery({
    queryKey: ["userPermissions"],
    queryFn: getUserPermissions,
    enabled: options?.enabled !== false,
    staleTime: 15 * 60 * 1000, // 15 minutes (permissions don't change frequently)
  });
}

/**
 * Convenience hook to get the permissions data directly
 */
export function usePermissions() {
  const query = useUserPermissions();
  return {
    ...query,
    permissions: query.data?.data,
  };
}

/**
 * Hook to check specific permission
 */
export function useHasPermission(permission: keyof PermissionsResponse['data']) {
  const { permissions, isLoading } = usePermissions();
  
  return {
    hasPermission: permissions?.[permission] ?? false,
    isLoading,
  };
}

/**
 * Hook for filtered contacts based on access control
 */
export function useFilteredContacts(
  params: AccessUsersParams = {},
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const query = useAccessibleUsers(params, options);

  return {
    ...query,
    contacts: query.data?.data.users ?? [],
    pagination: query.data?.data.pagination,
  };
}
