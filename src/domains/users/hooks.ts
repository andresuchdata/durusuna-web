"use client";

import { useQuery } from "@tanstack/react-query";
import { getContacts } from "./api";
import type { GetContactsParams } from "./types";

export function useContacts(params?: GetContactsParams) {
  return useQuery({
    queryKey: ["users", "contacts", params],
    queryFn: () => getContacts(params),
    staleTime: 30_000, // 30 seconds
  });
}

