import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://placehold.co/**')],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
