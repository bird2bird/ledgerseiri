import type { NextConfig } from "next";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return {
      // Keep existing Next.js API routes/pages first.
      // Only missing /api/* routes fall back to the Nest API container.
      fallback: [
        {
          source: "/api/:path*",
          destination: `${apiInternalUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
