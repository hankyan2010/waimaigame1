// 用 Web Audio API 程序化生成音效，不依赖任何外部音频文件，
// 避免带额外资源、避免被微信拦截第三方 audio 请求。

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * 播放"收银机 ka-ching"音效：
 * 模拟收银机开抽屉的声音 — 先一声清脆的"叮"，然后"哗啦"一堆硬币落下。
 */
export function playCoinSound() {
  const ctx = getCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // === 第一层：收银机"叮"声（清脆的金属敲击） ===
  const bell = ctx.createOscillator();
  const bellGain = ctx.createGain();
  bell.type = "sine";
  bell.frequency.setValueAtTime(3520, now); // A7 高音
  bell.frequency.exponentialRampToValueAtTime(2800, now + 0.15);
  bellGain.gain.setValueAtTime(0, now);
  bellGain.gain.linearRampToValueAtTime(0.3, now + 0.002); // 极快起音
  bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  bell.connect(bellGain);
  bellGain.connect(ctx.destination);
  bell.start(now);
  bell.stop(now + 0.22);

  // 泛音（让叮声更真实）
  const bell2 = ctx.createOscillator();
  const bell2Gain = ctx.createGain();
  bell2.type = "sine";
  bell2.frequency.setValueAtTime(5274, now); // E8
  bell2Gain.gain.setValueAtTime(0, now);
  bell2Gain.gain.linearRampToValueAtTime(0.12, now + 0.002);
  bell2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  bell2.connect(bell2Gain);
  bell2Gain.connect(ctx.destination);
  bell2.start(now);
  bell2.stop(now + 0.14);

  // === 第二层：硬币"哗啦"落下（延迟0.1秒，模拟抽屉弹开后硬币散落） ===
  const coinStart = now + 0.08;

  // 多个金属碰撞音（模拟一把硬币洒下来）
  const coinFreqs = [1200, 1500, 1800, 1400, 1600, 1100, 1700, 1300];
  coinFreqs.forEach((freq, i) => {
    const t = coinStart + i * 0.035 + Math.random() * 0.02; // 随机错位
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.08);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.06, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  });

  // === 第三层：低频"咚"（一袋钱落地的厚重感） ===
  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(150, coinStart);
  thud.frequency.exponentialRampToValueAtTime(60, coinStart + 0.2);
  thudGain.gain.setValueAtTime(0, coinStart);
  thudGain.gain.linearRampToValueAtTime(0.15, coinStart + 0.01);
  thudGain.gain.exponentialRampToValueAtTime(0.001, coinStart + 0.3);
  thud.connect(thudGain);
  thudGain.connect(ctx.destination);
  thud.start(coinStart);
  thud.stop(coinStart + 0.35);

  // === 第四层：金属碰撞噪声（硬币散落的沙沙声） ===
  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.4);
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 3);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.18;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(coinStart + 0.03);
    noise.stop(coinStart + 0.45);
  } catch {
    // 兼容处理
  }
}
