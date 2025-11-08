import { http } from "@/core/http/axios";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type Profile = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role?: "admin" | "user" | string;
  user_type?: "teacher" | "student" | "parent" | "admin" | string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  school_id?: string | null;
  is_active?: boolean;
  last_login_at?: string | null;
};

function transformProfile(data: any): Profile {
  if (!data || typeof data !== "object") {
    return data as Profile;
  }

  const firstName = data.first_name ?? data.firstName ?? "";
  const lastName = data.last_name ?? data.lastName ?? "";
  const fullName = data.name ?? [firstName, lastName].filter(Boolean).join(" ");

  return {
    ...data,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    name: fullName || undefined,
    avatar_url: data.avatar_url ?? data.avatarUrl ?? null,
    avatarUrl: data.avatarUrl ?? data.avatar_url ?? null,
  } as Profile;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await http().post("/auth/login", payload);
  return res.data as LoginResponse;
}

export async function fetchProfile(): Promise<Profile> {
  const res = await http().get("/auth/me");
  return transformProfile(res.data);
}
