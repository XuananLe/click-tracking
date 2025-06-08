import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://placehold.co/**')],
    dangerouslyAllowSVG: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
