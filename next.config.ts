import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships its own bundled dependencies; keep it external
  // so the server bundler doesn't try to re-bundle it.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
