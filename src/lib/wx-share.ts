"use client";

// 微信 JS-SDK 分享配置
//
// 关键约束：
// 1. wx.config 的 signature 是和「当前页面 URL（去掉 #）」绑定的，
//    SPA 内 router.push 之后要重新拉签名、重新 config，否则签名失效，
//    分享出去就是裸链接。
// 2. 微信只接受 https/http 的 imgUrl，不接受 dataURL/blob。
// 3. wx.updateAppMessageShareData 必须在 wx.ready 之后调用。

const WX_CONFIG_URL = "http://waimaiketang.com/wx-config";
const SHARE_IMG = "http://waimaiketang.com/game/share-cover.png";

export interface ShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

const DEFAULT_SHARE: ShareData = {
  title: "你是什么段位的外卖老板？10题见分晓",
  desc: "1万本金 + 7天 + 100道经营决策，看你能赚多少 or 亏多少。",
  link: "",
  imgUrl: SHARE_IMG,
};

// 记录已经成功 config 过的 URL，避免短时间内重复签名
let configuredUrl: string | null = null;
let inflight: Promise<void> | null = null;

function log(stage: string, payload?: unknown) {
  // 用 info 等级，方便线上抓日志，但不会刷屏
  // eslint-disable-next-line no-console
  console.info(`[wx-share] ${stage}`, payload ?? "");
}

function warn(stage: string, payload?: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`[wx-share] ${stage}`, payload ?? "");
}

function isWeChat(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.userAgent.toLowerCase().includes("micromessenger");
}

async function loadJssdk(): Promise<unknown> {
  if ((window as unknown as { wx?: unknown }).wx) {
    return (window as unknown as { wx: unknown }).wx;
  }
  log("loading jssdk");
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load wx jssdk"));
    document.head.appendChild(script);
  });
  return (window as unknown as { wx?: unknown }).wx;
}

async function configForCurrentUrl(): Promise<boolean> {
  const pageUrl = window.location.href.split("#")[0];
  if (configuredUrl === pageUrl) {
    log("already configured for", pageUrl);
    return true;
  }

  // 如果已经有进行中的 config，等它结束
  if (inflight) {
    try {
      await inflight;
    } catch {
      /* ignore, retry below */
    }
    if (configuredUrl === pageUrl) return true;
  }

  inflight = (async () => {
    log("requesting signature for", pageUrl);
    const res = await fetch(`${WX_CONFIG_URL}?url=${encodeURIComponent(pageUrl)}`);
    if (!res.ok) {
      // 抓一段响应 body 方便排查：405 = 后端服务没挂 /wx-config 路由，
      // 404 = nginx 没代理，502/504 = 签名服务宕机，403 = nginx 拦了。
      let bodySnippet = "";
      try {
        bodySnippet = (await res.text()).slice(0, 200);
      } catch {
        /* ignore */
      }
      throw new Error(`wx-config http ${res.status} body=${bodySnippet}`);
    }
    const config = (await res.json()) as {
      appId?: string;
      timestamp?: number;
      nonceStr?: string;
      signature?: string;
      error?: string;
    };
    if (config.error || !config.appId || !config.signature) {
      throw new Error(`wx-config error: ${config.error || "missing fields"}`);
    }

    const wx = (window as unknown as { wx: { config: (c: unknown) => void; ready: (cb: () => void) => void; error: (cb: (e: unknown) => void) => void } }).wx;
    wx.config({
      debug: false,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"],
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("wx.ready timeout")), 5000);
      wx.ready(() => {
        clearTimeout(t);
        resolve();
      });
      wx.error((err: unknown) => {
        clearTimeout(t);
        reject(new Error("wx.error: " + JSON.stringify(err)));
      });
    });

    configuredUrl = pageUrl;
    log("configured ok for", pageUrl);
  })();

  try {
    await inflight;
    return true;
  } catch (e) {
    warn("config failed", (e as Error).message);
    return false;
  } finally {
    inflight = null;
  }
}

export async function setupWxShare(shareData?: Partial<ShareData>): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isWeChat()) {
    log("not wechat browser, skip");
    return;
  }

  try {
    await loadJssdk();
  } catch (e) {
    warn("jssdk load failed", (e as Error).message);
    return;
  }

  const ok = await configForCurrentUrl();
  if (!ok) return;

  const data: ShareData = {
    title: shareData?.title || DEFAULT_SHARE.title,
    desc: shareData?.desc || DEFAULT_SHARE.desc,
    link: shareData?.link || window.location.href,
    imgUrl: shareData?.imgUrl || DEFAULT_SHARE.imgUrl,
  };

  const wx = (window as unknown as { wx: { updateAppMessageShareData: (d: unknown) => void; updateTimelineShareData: (d: unknown) => void } }).wx;
  try {
    wx.updateAppMessageShareData({
      title: data.title,
      desc: data.desc,
      link: data.link,
      imgUrl: data.imgUrl,
      success: () => log("appMessage share data set"),
      fail: (err: unknown) => warn("appMessage share fail", err),
    });
    wx.updateTimelineShareData({
      title: data.title,
      link: data.link,
      imgUrl: data.imgUrl,
      success: () => log("timeline share data set"),
      fail: (err: unknown) => warn("timeline share fail", err),
    });
    log("share data applied", { title: data.title });
  } catch (e) {
    warn("apply share data failed", (e as Error).message);
  }
}
