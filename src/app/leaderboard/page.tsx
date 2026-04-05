"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { Leaderboard } from "@/components/Leaderboard";
import { LevelProgress } from "@/components/LevelProgress";
import { track } from "@/lib/track";
import { getTierInfo, INITIAL_TIER } from "@/lib/config";

export default function LeaderboardPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    track("page_view", { page: "leaderboard" });
  }, []);

  const currentTier = hydrated ? store.currentTier : INITIAL_TIER;
  const tierInfo = getTierInfo(currentTier);
  const bestScore = hydrated ? store.bestScore : 0;
  const totalRounds = hydrated ? store.totalRoundsPlayed : 0;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Yellow top section */}
      <div className="bg-brand pt-6 pb-10 px-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full mb-2">
            <span className="text-xs font-medium text-title">🏆 老板排行榜</span>
          </div>
          <p className="text-sm text-title/70">
            和全国外卖老板比比经营实力
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10">
        {/* My stats card */}
        {hydrated && totalRounds > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-xl">
                {tierInfo.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-title">{tierInfo.label}</p>
                <p className="text-xs text-secondary">
                  最高 {bestScore} 分 · 挑战 {totalRounds} 轮
                </p>
              </div>
            </div>
            <LevelProgress currentTier={currentTier} compact />
          </div>
        )}

        {/* Full leaderboard */}
        <Leaderboard />
      </div>

      {/* Bottom */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          onClick={() => router.push("/")}
          className="w-full py-4 bg-card border border-border text-body text-base font-bold rounded-2xl active:scale-[0.98] transition-transform"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
