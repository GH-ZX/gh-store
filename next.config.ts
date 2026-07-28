import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose public environment variables to client/server bundles with fallbacks
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rbabtwjkqqzsbshzsgvz.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYWJ0d2prcXF6c2JzaHpzZ3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODkwMTAsImV4cCI6MjEwMDc2NTAxMH0.gzMCy3Xww7-nNznrZSL6l91KApeJhFkIF3PoPNmfeIU",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "GH-Store",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://gh-store.ahmedghuwu3.workers.dev",
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "ar",
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || "USD",
  },

  // Enable React Strict Mode for development
  reactStrictMode: true,

  // Fix Turbopack workspace root detection in pnpm monorepo-style setups
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
