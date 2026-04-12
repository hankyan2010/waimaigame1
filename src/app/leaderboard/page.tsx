"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG } from "@/lib/config";
import type { LeaderboardEntry } from "@/lib/types";
import { BrandBar } from "@/components/BrandBar";

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    fetchLeaderboard().then((data) => setEntries(data));
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="bg-brand pt-6 pb-10 px-6 rounded-b-[2rem] relative">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-5 text-sm font-bold text-title/70"
        >
          ← 返回
        </button>
        <div className="text-center">
          <div className="mb-3"><BrandBar /></div>
          <div className="text-3xl mb-1">🏆</div>
          <h1 className="text-2xl font-black text-title">外卖老板英雄榜</h1>
          <p className="text-sm text-title/70 mt-1">
            7 天净利润 Top 100 · 共 {entries.length} 位上榜
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 -mt-5 relative z-10 pb-6">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {!hydrated ? (
            <div className="p-6 text-center text-secondary text-base">加载中...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🪑</div>
              <p className="text-base font-bold text-title">榜单还是空的</p>
              <p className="text-sm text-secondary mt-1">
                通关 7 天 + 进入前 100 名即可上榜
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((e, idx) => {
                const rank = idx + 1;
                const ending = ENDING_INFO[e.ending];
                const tag = TAG_INFO[e.tag];
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        rank === 1
                          ? "bg-yellow-300 text-title"
                          : rank === 2
                          ? "bg-gray-300 text-title"
                          : rank === 3
                          ? "bg-amber-400 text-title"
                          : "bg-gray-100 text-secondary"
                      }`}
                    >
                      {rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-base font-black text-title truncate">
                          {e.displayName}
                        </p>
                        <span className="text-xs">{tag.emoji}</span>
                      </div>
                      <p className="text-xs text-secondary">
                        {ending.title} · 存活 {e.daysSurvived} 天 · {tag.label}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`text-base font-black ${
                          e.profit >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {e.profit >= 0 ? "+" : ""}¥{e.profit}
                      </div>
                      <div className="text-xs text-secondary">
                        最终 ¥{e.finalCash}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-secondary mt-4">
          初始本金 ¥{GAME_CONFIG.initialCash} · 经营 {GAME_CONFIG.maxDay} 天
          <br />
          全服实时排行，所有玩家同榜竞技
        </p>
      </div>
    </div>
  );
}
