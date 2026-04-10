"use client";

import { useMemo } from "react";

// 5 个方向变体 - 中心、左近、左远、右近、右远
// 故意预定义而不是用 CSS var()，因为 iOS WebKit 在 transform 函数里解析 var() 偶有问题
const VARIANTS = [
  "coin-shoot-c",
  "coin-shoot-l1",
  "coin-shoot-l2",
  "coin-shoot-r1",
  "coin-shoot-r2",
];

interface Props {
  count?: number;
}

export function CoinRain({ count = 36 }: Props) {
  const coins = useMemo(() => {
    // 多种"钱"的emoji，让人一眼看出是钱在飞
    const MONEY_EMOJIS = ["💰", "💵", "💴", "🤑", "💰", "💵", "💰", "💴"];
    const BIG_EMOJIS = ["💰", "🤑", "💵"];

    return Array.from({ length: count }, (_, i) => {
      const isBig = Math.random() < 0.25;
      const variant = VARIANTS[i % VARIANTS.length];
      return {
        id: i,
        startX: 50 + (Math.random() - 0.5) * 12,
        delay: Math.pow(Math.random(), 1.6) * 700,
        duration: 1600 + Math.random() * 800,
        size: isBig ? 36 + Math.random() * 12 : 24 + Math.random() * 12,
        emoji: isBig
          ? BIG_EMOJIS[Math.floor(Math.random() * BIG_EMOJIS.length)]
          : MONEY_EMOJIS[Math.floor(Math.random() * MONEY_EMOJIS.length)],
        variant,
      };
    });
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {coins.map((c) => (
        <div
          key={c.id}
          className={`coin-particle ${c.variant}`}
          style={{
            left: `${c.startX}vw`,
            fontSize: `${c.size}px`,
            animationDelay: `${c.delay}ms`,
            animationDuration: `${c.duration}ms`,
          }}
        >
          {c.emoji}
        </div>
      ))}
    </div>
  );
}
