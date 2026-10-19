import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page depends on the language/session cookies and must show fresh
  // match data, so we use plain dynamic rendering instead of Cache Components.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
