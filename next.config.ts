import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/new",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
