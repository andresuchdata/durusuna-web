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
  return useQuery({
    queryKey: ["users", "contacts", params],
    queryFn: () => getContacts(params),
    staleTime: 30_000,
  });
}

