import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The game is a fully static site: no server needed, easy to cache offline.
  output: "export",
};

export default nextConfig;
