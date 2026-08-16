import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    const proxy = process.env.API_PROXY_URL?.replace(/\/$/, "");
    return proxy
      ? [{ source: "/api/:path*", destination: `${proxy}/:path*` }]
      : [];
  },
};

export default nextConfig;
