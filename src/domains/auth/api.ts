import { http } from "@/core/http/axios";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type RegisterAdminPayload = {
  // School information
  school_name: string;
  school_address: string;
  school_phone?: string;
  school_email?: string;
  school_website?: string;
  
  // Admin user information
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
};

export type RegisterAdminResponse = {
  message: string;
  user: Profile;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
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

function transformProfile(data: unknown): Profile {
  if (!data || typeof data !== "object") {
    return data as Profile;
  }
  
  const profileData = data as Record<string, unknown>;

  const firstName = profileData.first_name ?? profileData.firstName ?? "";
  const lastName = profileData.last_name ?? profileData.lastName ?? "";
  const fullName = profileData.name ?? [firstName, lastName].filter(Boolean).join(" ");

  return {
    ...profileData,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    name: fullName || undefined,
    avatar_url: profileData.avatar_url ?? profileData.avatarUrl ?? null,
    avatarUrl: profileData.avatarUrl ?? profileData.avatar_url ?? null,
  } as Profile;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await http().post("/auth/login", payload);
  return res.data as LoginResponse;
}

export async function registerAdmin(payload: RegisterAdminPayload): Promise<RegisterAdminResponse> {
  const res = await http().post("/auth/register-admin", payload);
  return res.data as RegisterAdminResponse;
}

export async function fetchProfile(): Promise<Profile> {
  const res = await http().get("/auth/me");
  return transformProfile(res.data);
}
