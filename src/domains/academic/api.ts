import { http } from "@/core/http/axios";
import type { CurrentAcademicPeriodResponse } from "./types";

export async function fetchCurrentAcademicPeriod(): Promise<CurrentAcademicPeriodResponse> {
  const res = await http().get("/academic/current-period");
  return res.data as CurrentAcademicPeriodResponse;
}
