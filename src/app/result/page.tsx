"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG } from "@/lib/config";
import { track } from "@/lib/track";

export default function ResultPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !store.endingType) {
      router.push("/");
    } else if (hydrated && store.endingType) {
      track("game_end", {
        ending: store.endingType,
        tag: store.playerTag,
        finalCash: store.state.cash,
        daysSurvived: store.state.day,
      });
    }
  }, [hydrated]);

  if (!hydrated || !store.endingType || !store.playerTag) return null;

  const ending = ENDING_INFO[store.endingType];
  const tag = TAG_INFO[store.playerTag];
  const finalCash = store.state.cash;
  const profit = finalCash - GAME_CONFIG.initialCash;
  const daysSurvived = store.state.day;
  const isBankrupt = store.endingType === "bankrupt";

  // 战胜X%玩家（伪数据）
  const beatPercent = isBankrupt
    ? Math.max(5, Math.min(30, 10 + Math.floor(finalCash / 500)))
    : Math.max(40, Math.min(95, 50 + Math.floor(profit / 200)));

  const handlePlayAgain = () => {
    store.reset();
    router.push("/play");
  };

  const handleGoReward = () => {
    router.push("/reward");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top */}
      <div
        className="pt-8 pb-14 px-6 rounded-b-[2rem] relative overflow-hidden"
        style={{
          background:
            store.endingType === "thrive"
              ? "linear-gradient(135deg, #FFD100 0%, #FFA500 100%)"
              : store.endingType === "bankrupt"
              ? "linear-gradient(135deg, #6B7280 0%, #374151 100%)"
              : "#FFD100",
        }}
      >
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-2">{ending.emoji}</div>
          <p className="text-xs text-title/60 uppercase tracking-wider mb-1">
            7天经营结束
          </p>
          <h1 className="text-2xl font-black text-title mb-2">{ending.title}</h1>
          <div className="text-[44px] font-black text-title leading-none">
            {profit >= 0 ? "+" : ""}¥{profit}
          </div>
          <p className="text-xs text-title/60 mt-1">
            存活 {daysSurvived} 天 · 最终现金 ¥{finalCash}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-6 space-y-3 relative z-10">
        {/* Tag card */}
        <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
          <div className="text-3xl mb-2">{tag.emoji}</div>
          <p className="text-xs text-secondary mb-1">你的经营人格</p>
          <h3 className="text-lg font-black text-title mb-1">{tag.label}</h3>
          <p className="text-xs text-secondary">{tag.desc}</p>
        </div>

        {/* Verdict */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-body leading-relaxed">{ending.description}</p>
        </div>

        {/* Beat percent */}
        <div className="bg-brand/10 rounded-2xl p-4 text-center">
          <p className="text-xs text-secondary mb-1">你已经打败了</p>
          <div className="text-2xl font-black text-title">{beatPercent}%</div>
          <p className="text-xs text-secondary">的外卖老板</p>
        </div>

        {/* Daily history */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-title mb-3">7天经营回顾</p>
          <div className="space-y-2">
            {store.dailySummaries.map((d) => (
              <div
                key={d.day}
                className="flex items-center justify-between py-1 border-b border-border last:border-0"
              >
                <span className="text-xs text-secondary">Day {d.day}</span>
                <span className="text-xs text-body flex-1 px-2 truncate">
                  {d.comment}
                </span>
                <span
                  className={`text-xs font-bold ${
                    d.profit >= 0 ? "text-title" : "text-red-500"
                  }`}
                >
                  {d.profit >= 0 ? "+" : ""}¥{d.profit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <div className="space-y-2">
          <button
            onClick={handleGoReward}
            className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
          >
            {isBankrupt ? "看高手怎么做" : "领取经营福利"}
          </button>
          <button
            onClick={handlePlayAgain}
            className="w-full py-3 bg-card border border-border text-body text-sm font-bold rounded-2xl active:scale-[0.98] transition-transform"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
