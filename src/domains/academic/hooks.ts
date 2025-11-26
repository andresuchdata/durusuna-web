"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCurrentAcademicPeriod, fetchAcademicPeriods } from "./api";
import type { CurrentAcademicPeriodResponse, AcademicPeriodsResponse } from "./types";

export function useCurrentAcademicPeriod() {
  return useQuery<CurrentAcademicPeriodResponse>({
    queryKey: ["academic", "current-period"],
    queryFn: fetchCurrentAcademicPeriod,
    staleTime: 60_000,
  });
}

export function useAcademicPeriods() {
  return useQuery<AcademicPeriodsResponse>({
    queryKey: ["academic", "periods"],
    queryFn: fetchAcademicPeriods,
    staleTime: 60_000,
  });
}
