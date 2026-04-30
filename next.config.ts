import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/admin/soi-admin-panel",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
