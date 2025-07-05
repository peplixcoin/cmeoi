import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail build on warnings (temporary measure)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors (temporary measure)
    ignoreBuildErrors: true,
  },
  images: {
    // Configure image optimization
    domains: [], // Add your image host domains here
  },
};

export default nextConfig;