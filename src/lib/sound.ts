// 播放收银机 ka-ching 音效
// 使用 public/ka-ching.mp3 真实音效文件

let cachedAudio: HTMLAudioElement | null = null;

/**
 * 播放"收银机 ka-ching"音效
 */
export function playCoinSound() {
  if (typeof window === "undefined") return;

  try {
    // 每次创建新的 Audio 实例，避免快速连续触发时音频被截断
    // 但会复用第一次加载的缓存（浏览器会自动缓存 mp3）
    // Next.js static export: basePath 在编译时注入
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";
    const src = `${basePath}/ka-ching.mp3`;

    const audio = new Audio(src);
    audio.volume = 0.7;
    audio.play().catch(() => {
      // iOS Safari 需要用户手势后才能播放，静默失败不影响游戏
    });
  } catch {
    // 兼容处理
  }
}
