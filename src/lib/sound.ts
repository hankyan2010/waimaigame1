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
 * 播放"疯狂掉金币"音效：
 * 三连叮（高频金属音）+ 一点低频厚度，营造"钱入袋"的满足感。
 */
export function playCoinSound() {
  const ctx = getCtx();
  if (!ctx) return;

  // iOS Safari 需要用户手势后手动 resume
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // 三连叮：高音金属 ping，时间错位 60ms
  const baseFreqs = [1760, 2093, 2637]; // A6 / C7 / E7
  baseFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.055;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);
    // 轻微下滑，模拟金属共振衰减
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, startTime + 0.28);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.32);
  });

  // 底部低频嗡鸣：厚度感
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = "sine";
  sub.frequency.setValueAtTime(220, now);
  sub.frequency.exponentialRampToValueAtTime(110, now + 0.35);
  subGain.gain.setValueAtTime(0, now);
  subGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.42);

  // 粒子"哗啦"噪声：短暂白噪声带通滤波，模拟金币碰撞
  try {
    const bufferSize = ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // 衰减包络
      const env = Math.pow(1 - i / bufferSize, 2.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 4500;
    filter.Q.value = 1.2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.25;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.02);
    noise.stop(now + 0.3);
  } catch {
    // 某些浏览器不支持 BiquadFilter 也无妨，主音已经够了
  }
}
