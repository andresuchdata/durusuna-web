import axios, { AxiosError, AxiosInstance } from "axios";
import { env } from "@/core/config/env";
import { tokenStore } from "@/core/auth/token";

let client: AxiosInstance | null = null;

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: `${env.API_BASE_URL}/api`,
    timeout: 30000,
  });

  instance.interceptors.request.use((config) => {
    const token = tokenStore.access;
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  let refreshing: Promise<void> | null = null;

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const original = error.config as any;

      if (status === 401 && !original?._retry) {
        original._retry = true;
        if (!refreshing) {
          refreshing = refreshToken();
          try {
            await refreshing;
          } finally {
            refreshing = null;
          }
        } else {
          await refreshing;
        }
        const token = tokenStore.access;
        if (token) {
          original.headers = original.headers ?? {};
          original.headers["Authorization"] = `Bearer ${token}`;
          return instance(original);
        }
      }
      throw error;
    }
  );

  return instance;
}

async function refreshToken() {
  const refresh = tokenStore.refresh;
  if (!refresh) {
    tokenStore.clear();
    return;
  }
  try {
    const res = await axios.post(`${env.API_BASE_URL}/api/auth/refresh`, {
      refreshToken: refresh,
    });
    const { accessToken, refreshToken: newRefresh } = res.data ?? {};
    if (accessToken) tokenStore.access = accessToken;
    if (newRefresh) tokenStore.refresh = newRefresh;
  } catch {
    tokenStore.clear();
  }
}

export function http(): AxiosInstance {
  if (!client) client = createClient();
  return client;
}
