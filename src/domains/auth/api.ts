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
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await http().post("/auth/login", payload);
  return res.data as LoginResponse;
}

export async function fetchProfile(): Promise<Profile> {
  const res = await http().get("/auth/me");
  return res.data as Profile;
}
