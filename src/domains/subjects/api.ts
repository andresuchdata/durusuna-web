import { http } from "@/core/http/axios";
import type { SubjectsResponse } from "./types";

export async function fetchSubjects(): Promise<SubjectsResponse> {
  const res = await http().get("/subjects");
  return res.data as SubjectsResponse;
}
