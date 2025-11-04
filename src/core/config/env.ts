export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:3001"),
  SOCKET_URL:
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:3001"),
};
