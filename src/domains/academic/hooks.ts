"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentAcademicPeriod } from "./api";
import type { CurrentAcademicPeriodResponse } from "./types";

export function useCurrentAcademicPeriod() {
  return useQuery<CurrentAcademicPeriodResponse>({
    queryKey: ["academic", "current-period"],
    queryFn: fetchCurrentAcademicPeriod,
    staleTime: 60_000,
  });
}
