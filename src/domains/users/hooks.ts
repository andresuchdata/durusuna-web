"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  batchCreateUsers,
  createUser,
  deleteUser,
  getContacts,
  getUser,
  listUsers,
  updateUser,
} from "./api";
import { useAccessibleUsers, useUserPermissions } from "@/domains/access";
import type {
  BatchCreateUsersPayload,
  CreateUserPayload,
  GetContactsParams,
  UpdateUserPayload,
  UserListQuery,
} from "./types";

export function useUsers(params?: UserListQuery) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => listUsers(params),
    staleTime: 30_000,
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => {
      if (!id) throw new Error("User id is required");
      return getUser(id);
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => {
      if (!userId) throw new Error("User id is required");
      return updateUser(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["users", "detail", userId] });
      }
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBatchCreateUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchCreateUsersPayload) => batchCreateUsers(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useContacts(params?: GetContactsParams) {
  // Convert GetContactsParams to AccessUsersParams format
  const accessParams = {
    page: params?.page,
    limit: params?.limit,
    search: params?.search,
    userType: params?.userType as 'all' | 'teacher' | 'student' | 'parent' | undefined,
    includeInactive: false,
  };

  const accessQuery = useAccessibleUsers(accessParams);

  // Transform the response to match the old contacts format
  return {
    ...accessQuery,
    data: accessQuery.data ? {
      contacts: accessQuery.data.data.users.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        user_type: user.user_type as 'teacher' | 'student' | 'parent' | 'admin',
        role: user.role as 'admin' | 'user',
        school_id: user.school_id,
        is_active: user.is_active,
        last_active_at: user.last_login_at,
      })),
      pagination: accessQuery.data.data.pagination,
      totalContacts: accessQuery.data.data.pagination.total,
    } : undefined,
  };
}

