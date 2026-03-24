import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

function getBuildVersion(): string {
  try {
    const data = JSON.parse(readFileSync(join(__dirname, "version.json"), "utf8")) as { v: number };
    return `0.${data.v.toString().padStart(3, "0")}`;
  } catch {
    return "0.000";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: getBuildVersion(),
  },
};

export default nextConfig;
