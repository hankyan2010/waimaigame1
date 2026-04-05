"use client";

const WX_CONFIG_URL = "http://waimaiketang.com/wx-config";
const SHARE_IMG = "http://waimaiketang.com/game/share-cover.png";

interface ShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

let configured = false;

export async function setupWxShare(shareData?: Partial<ShareData>) {
  if (typeof window === "undefined") return;

  // Only run in WeChat browser
  const ua = navigator.userAgent.toLowerCase();
  if (!ua.includes("micromessenger")) return;

  // Load WeChat JS-SDK if not loaded
  if (!(window as any).wx) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load wx jssdk"));
      document.head.appendChild(script);
    });
  }

  const wx = (window as any).wx;
  if (!wx) return;

  // Get signature from server
  if (!configured) {
    try {
      const pageUrl = window.location.href.split("#")[0];
      const res = await fetch(`${WX_CONFIG_URL}?url=${encodeURIComponent(pageUrl)}`);
      const config = await res.json();

      if (config.error) {
        console.warn("wx config error:", config.error);
        return;
      }

      wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: [
          "updateAppMessageShareData",
          "updateTimelineShareData",
        ],
      });

      await new Promise<void>((resolve) => {
        wx.ready(() => {
          configured = true;
          resolve();
        });
        wx.error((err: any) => {
          console.warn("wx config failed:", err);
          resolve();
        });
      });
    } catch (e) {
      console.warn("wx setup error:", e);
      return;
    }
  }

  if (!configured) return;

  // Set share data
  const data: ShareData = {
    title: shareData?.title || "外卖老板段位测试，90%的人拿不到黄金",
    desc: shareData?.desc || "随机10题，测测你到底是青铜掌柜还是王者掌门",
    link: shareData?.link || window.location.href,
    imgUrl: shareData?.imgUrl || SHARE_IMG,
  };

  // Share to friend
  wx.updateAppMessageShareData({
    title: data.title,
    desc: data.desc,
    link: data.link,
    imgUrl: data.imgUrl,
  });

  // Share to timeline
  wx.updateTimelineShareData({
    title: data.title,
    link: data.link,
    imgUrl: data.imgUrl,
  });
}
