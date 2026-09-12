import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname, ".."),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  rewrites: async () => {
    const backendUrl = process.env.API_URL ?? 'http://backend:3001';
    return {
      beforeFiles: [
        {
          source: "/api/:path((?!revalidate(?:/|$)).*)",
          destination: `${backendUrl}/api/:path*`,  // ← localhost → backendUrl
        },
      ],
    };
  },
  // Prevent browsers and CDNs from caching HTML pages so that
  // ISR/revalidateTag updates are visible immediately on next load.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Static assets (_next/static) are content-hashed — keep them immutable.
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;