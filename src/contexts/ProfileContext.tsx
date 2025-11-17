"use client";

import { createContext, useContext } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchProfile, type Profile } from "@/domains/auth/api";
import { tokenStore } from "@/core/auth/token";

const ProfileContext = createContext<UseQueryResult<Profile> | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const query = useQuery<Profile>({
    queryKey: ["auth", "me"],
    queryFn: fetchProfile,
    enabled: typeof window !== "undefined" && !!tokenStore.access,
    staleTime: 60_000,
  });

  return <ProfileContext.Provider value={query}>{children}</ProfileContext.Provider>;
}

export function useProfileContext(): UseQueryResult<Profile> | undefined {
  return useContext(ProfileContext);
}

