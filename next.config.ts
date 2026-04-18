import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load .env / .env.local before reading vars so `next.config` can forward
// public Auth0 identifiers into the bundle. Proxy/middleware runs in a
// context where lazy `process.env.*` reads can be empty unless inlined.
const { combinedEnv } = loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  env: {
    ...(combinedEnv.AUTH0_DOMAIN
      ? { AUTH0_DOMAIN: combinedEnv.AUTH0_DOMAIN }
      : {}),
    ...(combinedEnv.AUTH0_CLIENT_ID
      ? { AUTH0_CLIENT_ID: combinedEnv.AUTH0_CLIENT_ID }
      : {}),
  },
};

export default nextConfig;
