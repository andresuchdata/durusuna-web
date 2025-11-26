import { http } from "@/core/http/axios";
import type { CurrentAcademicPeriodResponse, AcademicPeriodsResponse } from "./types";

export async function fetchCurrentAcademicPeriod(): Promise<CurrentAcademicPeriodResponse> {
  const res = await http().get("/academic/current-period");
  return res.data as CurrentAcademicPeriodResponse;
}

export async function fetchAcademicPeriods(): Promise<AcademicPeriodsResponse> {
  const res = await http().get("/academic/periods");
  return res.data as AcademicPeriodsResponse;
}
