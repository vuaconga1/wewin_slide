import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A dropped Turbopack chunk-version cell makes server HMR resubscribe, reload
  // the open pages, and log Fast Refresh forever while the browser is idle.
  experimental: {
    turbopackServerFastRefresh: false,
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "pdf-parse", "mammoth"],
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
