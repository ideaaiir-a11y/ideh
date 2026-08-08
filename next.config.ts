import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  // Ensure env vars are available in build
  env: {
    ZAI_API_KEY: process.env.ZAI_API_KEY,
    ZAI_BASE_URL: process.env.ZAI_BASE_URL,
  },
};

export default nextConfig;
