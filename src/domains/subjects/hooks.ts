"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSubjects } from "./api";
import type { SubjectsResponse } from "./types";

export function useSubjects() {
  return useQuery<SubjectsResponse>({
    queryKey: ["subjects", "all"],
    queryFn: fetchSubjects,
    staleTime: 30_000,
  });
}
