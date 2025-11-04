import type { NextConfig } from "next";
import nextPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const baseConfig: NextConfig = {
  reactCompiler: true,
  // Silence Next.js warning and explicitly enable Turbopack in dev
  turbopack: {},
};

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      urlPattern: (args: any) => args.url.origin === self.location.origin,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
      },
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      urlPattern: (args: any) => args.url.pathname.startsWith("/api"),
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
      },
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      urlPattern: (args: any) => /\.(?:png|jpg|jpeg|svg|gif|webp)$/.test(args.url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
});

const nextConfig = isProd ? withPWA(baseConfig) : baseConfig;

export default nextConfig;
