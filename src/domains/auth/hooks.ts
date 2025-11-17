"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, registerAdmin, LoginPayload, RegisterAdminPayload, Profile } from "./api";
import { tokenStore } from "@/core/auth/token";
import { useProfileContext } from "@/contexts/ProfileContext";

export function useProfile() {
  const ctx = useProfileContext();
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
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
