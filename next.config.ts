import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s1.ticketm.net",
      },
      {
        protocol: "https",
        hostname: "**.ticketmaster.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
