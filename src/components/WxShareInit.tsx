"use client";

import { useEffect } from "react";
import { setupWxShare } from "@/lib/wx-share";

export function WxShareInit() {
  useEffect(() => {
    setupWxShare();
  }, []);

  return null;
}
