"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { SharePoster } from "@/components/SharePoster";
import { ShareGuide } from "@/components/ShareGuide";
import { LevelProgress } from "@/components/LevelProgress";
import { track } from "@/lib/track";
import { getTierInfo, INITIAL_TIER } from "@/lib/config";

export default function HomePage() {
  const router = useRouter();
  const store = useGameStore();
  const [showPoster, setShowPoster] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    track("page_view");
  }, []);

  const canPlay = hydrated ? store.canPlay() : true;
  const currentTier = hydrated ? store.currentTier : INITIAL_TIER;
  const tierInfo = getTierInfo(currentTier);
  const totalRounds = hydrated ? store.totalRoundsPlayed : 0;
  const storeLevel = hydrated
    ? Object.values(store.storeState).reduce((a, b) => a + b, 0)
    : 0;

  const handleStart = () => {
    if (canPlay) {
      router.push("/play");
    }
  };

  const handleShareConfirm = () => {
    store.markSharedForNextRound();
    setShowPoster(false);
    setShowGuide(true);
    track("share_confirm");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top decoration */}
      <div className="bg-brand pt-5 pb-8 px-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full mb-2">
            <span className="text-xs font-medium text-title">
              外卖经营知识挑战
            </span>
          </div>

          <h1 className="text-2xl font-black text-title leading-tight mb-1">
            10题测出你的
            <br />
            <span className="text-[28px]">经营真本事</span>
          </h1>

          <p className="text-sm text-title/70 leading-snug max-w-[280px] mx-auto">
            别再靠感觉做外卖了
            <br />
            答完 10 题，看看你到底懂多少
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10">
        {/* Current tier card - show after first play */}
        {hydrated && totalRounds > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-xl">
                {tierInfo.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-title">我的段位 · {tierInfo.label}</p>
                <p className="text-xs text-secondary">已挑战 {totalRounds} 轮</p>
              </div>
              <button
                onClick={() => router.push("/leaderboard")}
                className="text-xs text-brand-dark font-bold px-3 py-1.5 bg-brand/10 rounded-full"
              >
                🏆 排行榜
              </button>
            </div>
            <LevelProgress currentTier={currentTier} compact />
          </div>
        )}

        {/* Reward hook card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <p className="text-sm font-bold text-title">完成挑战领福利</p>
              <p className="text-xs text-secondary">
                答题 + 养店，解锁你的专属经营福利
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "📊", label: "经营诊断" },
              { icon: "📖", label: "实战攻略" },
              { icon: "🎯", label: "专属方案" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-bg rounded-lg py-2 text-center"
              >
                <div className="text-lg mb-0.5">{item.icon}</div>
                <div className="text-xs text-secondary">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-title mb-3">挑战流程</p>
          <div className="flex items-center justify-between">
            {[
              { step: "1", label: "随机10题" },
              { step: "2", label: "答题升级" },
              { step: "3", label: "段位晋级" },
              { step: "4", label: "领取福利" },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-sm font-bold text-title mb-1">
                    {item.step}
                  </div>
                  <span className="text-xs text-secondary">{item.label}</span>
                </div>
                {idx < 3 && (
                  <div className="w-6 h-[1px] bg-border mx-1 mb-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 12-tier rank preview */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-title mb-3">12 级段位等你挑战</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: "青铜掌柜", range: "3级", color: "#CD7F32", tiers: "青铜3→2→1" },
              { title: "白银店长", range: "3级", color: "#C0C0C0", tiers: "白银3→2→1" },
              { title: "黄金操盘手", range: "3级", color: "#FFD700", tiers: "黄金3→2→1" },
              { title: "王者掌门", range: "3级", color: "#FF4500", tiers: "王者3→2→1" },
            ].map((rank) => (
              <div
                key={rank.title}
                className="bg-bg rounded-lg px-3 py-2.5 flex items-center gap-2"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: rank.color }}
                />
                <div>
                  <p className="text-xs font-bold text-title">{rank.title}</p>
                  <p className="text-[10px] text-secondary">{rank.tiers}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store progress hint */}
        {hydrated && storeLevel > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-xl">
                🏪
              </div>
              <div>
                <p className="text-sm font-bold text-title">
                  我的店铺 Lv.{storeLevel}
                </p>
                <p className="text-xs text-secondary">
                  继续答题升级你的店铺
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="sticky bottom-0 px-6 pb-6 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        {canPlay ? (
          <button
            onClick={handleStart}
            className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
          >
            {hydrated && totalRounds === 0 ? "开始首轮挑战" : "继续挑战下一轮"}
          </button>
        ) : (
          <button
            onClick={() => setShowPoster(true)}
            className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
          >
            分享解锁下一轮
          </button>
        )}
      </div>

      {showPoster && (
        <SharePoster
          score={store.bestScore}
          rank={store.bestRank || "青铜掌柜"}
          storeLevel={storeLevel}
          storeState={store.storeState}
          onClose={() => setShowPoster(false)}
          onConfirmShared={handleShareConfirm}
        />
      )}

      {showGuide && <ShareGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
