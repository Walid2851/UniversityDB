import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress build errors from supabase ssr peer deps
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
