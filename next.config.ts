import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone mode for Docker, Vercel & Cloudflare Pages adaptivity
  output: process.env.NEXT_BUILD_STANDALONE ? "standalone" : undefined,
  async headers() {
    return [
      {
        source: "/:path*.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
