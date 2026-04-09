"use client";

import { useMemo } from "react";

interface Props {
  /**
   * 每次 trigger 变化就会生成新一批金币。父组件配合 key 使用，
   * 例：{showCoin && <CoinRain key={coinKey} />}
   */
  count?: number;
}

export function CoinRain({ count = 32 }: Props) {
  const coins = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const isBigCoin = Math.random() < 0.25;
      const emoji = isBigCoin ? "💰" : "🪙";
      return {
        id: i,
        // 横向位置：0-100% 均匀分布 + 一点抖动
        left: (i / count) * 100 + (Math.random() - 0.5) * 8,
        // 延迟：前半段更密集，营造"爆发感"
        delay: Math.pow(Math.random(), 1.8) * 700,
        // 下落时长：1.4-2.4s
        duration: 1400 + Math.random() * 1000,
        // 随机旋转 -720 ~ +720 度
        rotation: Math.floor((Math.random() - 0.5) * 1440),
        // 横向漂移 -40 ~ +40 px，模拟重力+空气阻力
        drift: Math.floor((Math.random() - 0.5) * 80),
        // 大小：大金币 36-48，小金币 22-34
        size: isBigCoin ? 36 + Math.random() * 12 : 22 + Math.random() * 12,
        emoji,
      };
    });
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {coins.map((c) => (
        <div
          key={c.id}
          className="coin-particle"
          style={
            {
              left: `${c.left}%`,
              fontSize: `${c.size}px`,
              animationDelay: `${c.delay}ms`,
              animationDuration: `${c.duration}ms`,
              "--rotation": `${c.rotation}deg`,
              "--drift": `${c.drift}px`,
            } as React.CSSProperties
          }
        >
          {c.emoji}
        </div>
      ))}
    </div>
  );
}
