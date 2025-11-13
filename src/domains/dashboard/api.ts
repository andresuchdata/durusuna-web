import { http } from "@/core/http/axios";
import type { AdminDashboardData } from "./types";

export async function fetchAdminDashboardLessons(): Promise<AdminDashboardData> {
  const res = await http().get("/lessons/admin/dashboard");
  return res.data as AdminDashboardData;
}
