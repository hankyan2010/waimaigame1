"use client";

// 微信 JS-SDK 分享配置

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";
// 用相对路径请求签名，避免跨域和协议不一致问题
const WX_CONFIG_URL = "/wx-config";
const SHARE_IMG = `https://waimaiketang.com${BASE_PATH}/share-cover.png`;

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

let configuredUrl: string | null = null;
let inflight: Promise<void> | null = null;

export function resetWxConfig() {
  configuredUrl = null;
  inflight = null;
}

// === 可视化 debug 面板（微信内始终显示，方便排查） ===
let debugEl: HTMLDivElement | null = null;
let debugEnabled = false;

function ensureDebugPanel() {
  if (typeof window === "undefined") return;
  // URL 带 wxdebug 就开启
  debugEnabled = new URLSearchParams(window.location.search).has("wxdebug");
  if (!debugEnabled) return;
  if (debugEl) return;
  debugEl = document.createElement("div");
  debugEl.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;max-height:35vh;overflow:auto;" +
    "background:rgba(0,0,0,0.9);color:#0f0;font:11px/1.5 monospace;padding:8px;" +
    "z-index:99999;white-space:pre-wrap;word-break:break-all;";
  document.body.appendChild(debugEl);
}

function dbg(msg: string) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${msg}`;
  // eslint-disable-next-line no-console
  console.info(`[wx] ${line}`);
  if (debugEnabled && debugEl) {
    debugEl.textContent += line + "\n";
    debugEl.scrollTop = debugEl.scrollHeight;
  }
}

function isWeChat(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.userAgent.toLowerCase().includes("micromessenger");
}

async function loadJssdk(): Promise<void> {
  if ((window as unknown as { wx?: unknown }).wx) {
    dbg("jssdk already loaded");
    return;
  }
  dbg("loading jssdk...");
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    script.onload = () => { dbg("jssdk loaded OK"); resolve(); };
    script.onerror = () => { dbg("jssdk FAILED to load"); reject(new Error("jssdk load fail")); };
    document.head.appendChild(script);
  });
}

async function configForCurrentUrl(): Promise<boolean> {
  // 签名用的URL必须和浏览器地址栏【完全一致】（只去掉#后面的部分）
  // 不能删任何query参数，否则微信校验会报 invalid signature
  const pageUrl = window.location.href.split("#")[0];

  dbg(`pageUrl for sign: ${pageUrl}`);

  if (configuredUrl === pageUrl) {
    dbg("already configured, skip");
    return true;
  }

  if (inflight) {
    try { await inflight; } catch { /* retry */ }
    if (configuredUrl === pageUrl) return true;
  }

  inflight = (async () => {
    const fetchUrl = `${WX_CONFIG_URL}?url=${encodeURIComponent(pageUrl)}`;
    dbg(`fetch: ${fetchUrl}`);

    const res = await fetch(fetchUrl);
    dbg(`fetch status: ${res.status}`);
    if (!res.ok) {
      let body = "";
      try { body = (await res.text()).slice(0, 200); } catch {}
      throw new Error(`http ${res.status} body=${body}`);
    }

    const config = await res.json();
    dbg(`config resp: appId=${config.appId} ts=${config.timestamp} sig=${config.signature?.slice(0, 12)}...`);

    if (config.error || !config.appId || !config.signature) {
      throw new Error(`config error: ${config.error || "missing fields"}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (window as any).wx;

    // 只注册老API——新API对认证订阅号没有权限（报 offline verifying）
    const jsApiList = [
      "onMenuShareAppMessage",
      "onMenuShareTimeline",
    ];

    dbg(`wx.config debug=${debugEnabled} apiList=${jsApiList.join(",")}`);
    wx.config({
      debug: debugEnabled,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList,
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        dbg("wx.ready TIMEOUT 5s");
        reject(new Error("wx.ready timeout"));
      }, 5000);

      wx.ready(() => {
        clearTimeout(t);
        dbg("wx.ready OK ✓");
        resolve();
      });

      wx.error((err: unknown) => {
        clearTimeout(t);
        dbg(`wx.error: ${JSON.stringify(err)}`);
        reject(new Error("wx.error: " + JSON.stringify(err)));
      });
    });

    configuredUrl = pageUrl;
  })();

  try {
    await inflight;
    return true;
  } catch (e) {
    dbg(`config FAILED: ${(e as Error).message}`);
    return false;
  } finally {
    inflight = null;
  }
}

export async function setupWxShare(shareData?: Partial<ShareData>): Promise<void> {
  if (typeof window === "undefined") return;

  ensureDebugPanel();

  dbg(`isWeChat=${isWeChat()} UA=${navigator.userAgent.slice(0, 80)}`);

  if (!isWeChat()) {
    dbg("not wechat, skip");
    return;
  }

  try {
    await loadJssdk();
  } catch (e) {
    dbg(`jssdk fail: ${(e as Error).message}`);
    return;
  }

  const ok = await configForCurrentUrl();
  if (!ok) {
    dbg("config failed, share will be raw URL");
    return;
  }

  const data: ShareData = {
    title: shareData?.title || DEFAULT_SHARE.title,
    desc: shareData?.desc || DEFAULT_SHARE.desc,
    link: shareData?.link || window.location.href,
    imgUrl: shareData?.imgUrl || DEFAULT_SHARE.imgUrl,
  };

  dbg(`share data: title=${data.title.slice(0, 30)} link=${data.link.slice(0, 50)}`);
  dbg(`share img: ${data.imgUrl}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wx = (window as any).wx;

  try {
    // 只用老API（onMenuShare*）——认证订阅号只有这个权限
    // 新API（update*ShareData）对订阅号报 "offline verifying"，不调
    wx.onMenuShareAppMessage({
      title: data.title,
      desc: data.desc,
      link: data.link,
      imgUrl: data.imgUrl,
      success: () => dbg("onMenuShareAppMessage OK ✓"),
      cancel: () => dbg("onMenuShareAppMessage cancel"),
      fail: (err: unknown) => dbg(`onMenuShareAppMessage FAIL: ${JSON.stringify(err)}`),
    });

    wx.onMenuShareTimeline({
      title: data.title,
      link: data.link,
      imgUrl: data.imgUrl,
      success: () => dbg("onMenuShareTimeline OK ✓"),
      cancel: () => dbg("onMenuShareTimeline cancel"),
      fail: (err: unknown) => dbg(`onMenuShareTimeline FAIL: ${JSON.stringify(err)}`),
    });

    dbg("old share APIs called ✓");
  } catch (e) {
    dbg(`share apply error: ${(e as Error).message}`);
  }
}
