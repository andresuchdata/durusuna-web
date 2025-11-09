"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, login, registerAdmin, LoginPayload, RegisterAdminPayload, Profile } from "./api";
import { tokenStore } from "@/core/auth/token";

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ["auth", "me"],
    queryFn: fetchProfile,
    enabled: typeof window !== "undefined" && !!tokenStore.access,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async (data) => {
      tokenStore.access = data.accessToken ?? null;
      if (data.refreshToken) tokenStore.refresh = data.refreshToken;
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useRegisterAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterAdminPayload) => registerAdmin(payload),
    onSuccess: async (data) => {
      tokenStore.access = data.accessToken ?? null;
      if (data.refreshToken) tokenStore.refresh = data.refreshToken;
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
