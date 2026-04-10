"use client";

// 微信 JS-SDK 分享配置

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";
const WX_CONFIG_URL = "/wx-config";
// 图片必须 HTTPS（http在https页面会被iOS WebKit拦截）
const SHARE_IMG = `https://waimaiketang.com${BASE_PATH}/share-cover.png?v=2`;

export interface ShareData {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

const DEFAULT_SHARE: ShareData = {
  title: "我用外卖模拟器7天赚了¥63,000，你能赚多少？来比试一下真功夫",
  desc: "1万本金起步，100道真实经营决策，曝光、转化、差评全实时变化",
  link: "",
  imgUrl: SHARE_IMG,
};

let configuredUrl: string | null = null;

export function resetWxConfig() {
  configuredUrl = null;
}

// === Debug ===
let debugEl: HTMLDivElement | null = null;
let debugOn = false;

function initDebug() {
  if (typeof window === "undefined") return;
  debugOn = new URLSearchParams(window.location.search).has("wxdebug");
  if (!debugOn || debugEl) return;
  debugEl = document.createElement("div");
  debugEl.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;max-height:35vh;overflow:auto;" +
    "background:rgba(0,0,0,0.9);color:#0f0;font:11px/1.5 monospace;padding:8px;" +
    "z-index:99999;white-space:pre-wrap;word-break:break-all;";
  document.body.appendChild(debugEl);
}

function dbg(msg: string) {
  const t = new Date().toLocaleTimeString();
  const line = `[${t}] ${msg}`;
  // eslint-disable-next-line no-console
  console.info(`[wx] ${line}`);
  if (debugOn && debugEl) {
    debugEl.textContent += line + "\n";
    debugEl.scrollTop = debugEl.scrollHeight;
  }
}

function isWeChat(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.userAgent.toLowerCase().includes("micromessenger");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wxObj: any = null;

async function loadJssdk(): Promise<void> {
  if ((window as any).wx) {
    wxObj = (window as any).wx;
    dbg("jssdk already loaded");
    return;
  }
  dbg("loading jssdk...");
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    s.onload = () => { wxObj = (window as any).wx; dbg("jssdk loaded OK"); resolve(); };
    s.onerror = () => { dbg("jssdk FAILED"); reject(new Error("jssdk fail")); };
    document.head.appendChild(s);
  });
}

function cleanShareLink(): string {
  // 分享出去的链接去掉 wxdebug，保持干净
  const url = new URL(window.location.href);
  url.searchParams.delete("wxdebug");
  url.hash = "";
  return url.toString();
}

export async function setupWxShare(shareData?: Partial<ShareData>): Promise<void> {
  if (typeof window === "undefined") return;
  initDebug();

  dbg(`isWeChat=${isWeChat()} UA=${navigator.userAgent.slice(0, 80)}`);

  if (!isWeChat()) {
    dbg("not wechat, skip");
    return;
  }

  try { await loadJssdk(); } catch { return; }
  if (!wxObj) { dbg("wx obj missing"); return; }

  // === 签名 ===
  const pageUrl = window.location.href.split("#")[0];
  dbg(`sign url: ${pageUrl}`);

  if (configuredUrl !== pageUrl) {
    try {
      const fetchUrl = `${WX_CONFIG_URL}?url=${encodeURIComponent(pageUrl)}`;
      dbg(`fetch: ${fetchUrl}`);
      const res = await fetch(fetchUrl);
      dbg(`fetch status: ${res.status}`);
      if (!res.ok) throw new Error(`http ${res.status}`);

      const cfg = await res.json();
      dbg(`resp: appId=${cfg.appId} sig=${String(cfg.signature).slice(0, 12)}...`);
      if (!cfg.appId || !cfg.signature) throw new Error("missing fields");

      // 不用 beta:true（普通订阅号不需要，且可能导致 checkJsApi 虚报）
      // 只注册实际要用的API
      const jsApiList = [
        "updateAppMessageShareData",
        "updateTimelineShareData",
      ];

      dbg(`wx.config debug=${debugOn} apis=${jsApiList.join(",")}`);
      wxObj.config({
        debug: debugOn,
        appId: cfg.appId,
        timestamp: cfg.timestamp,
        nonceStr: cfg.nonceStr,
        signature: cfg.signature,
        jsApiList,
      });

      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => { dbg("wx.ready TIMEOUT"); reject(new Error("timeout")); }, 8000);
        wxObj.ready(() => { clearTimeout(t); dbg("wx.ready OK ✓"); resolve(); });
        wxObj.error((e: any) => {
          clearTimeout(t);
          dbg(`wx.error: ${JSON.stringify(e)}`);
          reject(new Error(JSON.stringify(e)));
        });
      });

      configuredUrl = pageUrl;
    } catch (e: any) {
      dbg(`config FAILED: ${e.message}`);
      return;
    }
  } else {
    dbg("already configured, skip sign");
  }

  // === 分享数据 ===
  const link = cleanShareLink();
  const data: ShareData = {
    title: shareData?.title || DEFAULT_SHARE.title,
    desc: shareData?.desc || DEFAULT_SHARE.desc,
    link,
    imgUrl: shareData?.imgUrl || DEFAULT_SHARE.imgUrl,
  };

  dbg(`title: ${data.title}`);
  dbg(`link: ${data.link}`);
  dbg(`img: ${data.imgUrl}`);

  // === 只用新API（避免新老API冲突） ===
  try {
    wxObj.updateAppMessageShareData({
      title: data.title,
      desc: data.desc,
      link: data.link,
      imgUrl: data.imgUrl,
      success: () => dbg("updateAppMsg OK ✓"),
      fail: (e: any) => dbg(`updateAppMsg FAIL: ${JSON.stringify(e)}`),
    });

    wxObj.updateTimelineShareData({
      title: data.title,
      link: data.link,
      imgUrl: data.imgUrl,
      success: () => dbg("updateTimeline OK ✓"),
      fail: (e: any) => dbg(`updateTimeline FAIL: ${JSON.stringify(e)}`),
    });

    dbg("share APIs called ✓");
  } catch (e: any) {
    dbg(`share error: ${e.message}`);
  }
}
