"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setupWxShare } from "@/lib/wx-share";

export function WxShareInit() {
  const pathname = usePathname();

  // 每次路由变化都重新签名 + 设置分享数据
  // 因为微信 JS-SDK 的 signature 是和当前页面 URL 绑定的
  useEffect(() => {
    // 延迟 300ms，等页面状态稳定后再签名
    const timer = setTimeout(() => {
      setupWxShare();
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
