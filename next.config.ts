import type { NextConfig } from "next";

// basePath 由环境变量控制，默认 /oldgame（Game1 的线上路径）
// build 时通过 NEXT_PUBLIC_BASE_PATH=/oldgame 覆盖（也可改成其它前缀做平行部署）
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
};

export default nextConfig;
