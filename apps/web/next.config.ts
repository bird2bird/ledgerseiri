import type { NextConfig } from "next";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      // Explicitly proxy Nest API routes used by client-side app pages.
      // Keep existing Next.js API routes such as /api/dashboard/cockpit-v3 untouched.
      {
        source: "/api/inventory/:path*",
        destination: `${apiInternalUrl}/api/inventory/:path*`,
      },
      {
        source: "/api/products",
        destination: `${apiInternalUrl}/api/products`,
      },
      {
        source: "/api/products/:path*",
        destination: `${apiInternalUrl}/api/products/:path*`,
      },
    ];
  },
};

export default nextConfig;
