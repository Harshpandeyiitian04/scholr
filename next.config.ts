import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "canvas", "jsdom"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
