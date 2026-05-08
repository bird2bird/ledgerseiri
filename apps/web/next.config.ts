import type { NextConfig } from "next";

const apiProxyTarget = process.env.INTERNAL_API_BASE_URL || "http://api:3001";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
