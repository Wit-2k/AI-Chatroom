import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";
const isTauriBuild = process.env.TAURI_BUILD === "1";

const config: NextConfig = {};

if (isTauriBuild) {
  // Tauri 构建：静态导出，不需要 rewrites
  config.output = "export";
  config.distDir = "out";
} else {
  // Web 模式：需要 rewrites 代理
  config.rewrites = async () => [
    { source: "/api/:path*", destination: `${BACKEND}/:path*` },
  ];
}

export default config;
