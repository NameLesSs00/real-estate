import type { NextConfig } from "next";
import { API_HOSTNAME, API_DOMAIN } from "./lib/api/config";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'winners-realty.com',
      },
      {
        protocol: 'https',
        hostname: API_HOSTNAME,
      },
      {
        protocol: 'https',
        hostname: 'websiterealstate.runasp.net',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${API_DOMAIN}/:path*`,
      },
    // return [
    //   {
    //     source: '/backend/:path*',
    //     destination: 'https://websiterealstate.runasp.net/:path*',
    //   },
    ];
  },
};

export default nextConfig;
