// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Izinkan semua gambar dari Supabase
      },
    ],
  },
};

export default nextConfig;