declare module "next-pwa" {
  import type { NextConfig } from "next";
  type PWAOptions = Record<string, unknown>;
  export default function withPWA(options?: PWAOptions): (config: NextConfig) => NextConfig;
}
