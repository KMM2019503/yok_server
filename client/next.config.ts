import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app lives inside the yok_server repo (which has its own lockfile).
  // Pin Turbopack's root to the client dir so it doesn't infer the parent.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
