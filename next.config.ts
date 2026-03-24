import type { NextConfig } from "next";
import { execSync } from "child_process";

function getBuildVersion(): string {
  try {
    const commitCount = parseInt(execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim(), 10);
    const version = commitCount - 104;
    return `0.${version.toString().padStart(3, "0")}`;
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
