"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG } from "@/lib/config";
import { getLeaderboard } from "@/lib/leaderboard";
import { setupWxShare } from "@/lib/wx-share";

export default function HomePage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [showShareGate, setShowShareGate] = useState(false);

  const [boardCount, setBoardCount] = useState(0);
  const [topName, setTopName] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    track("page_view");
    const board = getLeaderboard();
    setBoardCount(board.length);
    setTopName(board[0]?.displayName ?? null);
    setupWxShare();
  }, []);

  const canPlay = hydrated ? store.canPlay() : true;
  const remainingPlays = hydrated ? store.remainingFreePlays() : 3;
  const totalPlays = hydrated ? store.totalPlays : 0;
  const bestCash = hydrated ? store.bestFinalCash : 0;
  const bestDays = hydrated ? store.bestDaysSurvived : 0;

  const handleStart = () => {
    if (canPlay) {
      store.reset();
      router.push("/play");
      track("start_click");
    } else {
      setShowShareGate(true);
      track("share_gate_shown");
    }
  };

  const handleShareToUnlock = () => {
    store.markSharedForExtraPlay();
    setShowShareGate(false);
    track("share_unlock_success");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-brand pt-6 pb-12 px-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full mb-2">
            <span className="text-xs font-medium text-title">经营模拟游戏</span>
          </div>

          <h1 className="text-2xl font-black text-title leading-tight mb-1">
            外卖老板
            <br />
            <span className="text-[30px]">7天生存挑战</span>
          </h1>

          <p className="text-sm text-title/70 leading-snug max-w-[280px] mx-auto">
            1万本金起步，7天经营
            <br />
            看看你能赚多少 or 亏多少
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-6 space-y-3 relative z-10">
        {/* Best record */}
        {hydrated && totalPlays > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-secondary mb-2">我的最佳战绩</p>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="最高现金" value={`¥${bestCash}`} />
              <Stat label="最多存活" value={`${bestDays}天`} />
              <Stat label="挑战次数" value={totalPlays} />
            </div>
          </div>
        )}

        {/* Today plays */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-title">今日挑战次数</p>
              <p className="text-xs text-secondary">每日刷新，分享可加次数</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-title">{remainingPlays}</div>
              <div className="text-[10px] text-secondary">剩余</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-title mb-3">游戏规则</p>
          <div className="space-y-2 text-xs text-body">
            <div className="flex gap-2">
              <span className="text-brand-dark font-bold">•</span>
              <span>初始现金 ¥{GAME_CONFIG.initialCash}，经营 {GAME_CONFIG.maxDay} 天</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-dark font-bold">•</span>
              <span>每天 {GAME_CONFIG.questionsPerDay} 个经营决策，每个选择都有代价</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-dark font-bold">•</span>
              <span>每日固定成本 ¥{GAME_CONFIG.dailyRent + GAME_CONFIG.dailyStaff}（租金+员工）</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-dark font-bold">•</span>
              <span>现金 ≤ 0 = 倒闭，活下来的才是赢家</span>
            </div>
          </div>
        </div>

        {/* Initial stats */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-title mb-3">开局状态</p>
          <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <Stat label="现金" value={`¥${GAME_CONFIG.initialCash}`} />
            <Stat label="曝光" value={GAME_CONFIG.initialExposure} />
            <Stat label="客单价" value={`¥${GAME_CONFIG.initialAvgPrice}`} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="入店率" value={`${(GAME_CONFIG.initialEnterConversion * 100).toFixed(0)}%`} />
            <Stat label="下单率" value={`${(GAME_CONFIG.initialOrderConversion * 100).toFixed(0)}%`} />
            <Stat label="差评率" value={`${(GAME_CONFIG.initialBadReviewRate * 100).toFixed(0)}%`} />
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-6 pb-6 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <button onClick={handleStart} className="btn-raised text-base">
          {!hydrated
            ? "开始挑战"
            : !canPlay
            ? "分享解锁挑战"
            : totalPlays === 0
            ? "开始首次挑战"
            : "再来一局"}
        </button>
        <button
          onClick={() => router.push("/leaderboard")}
          className="btn-raised-ghost text-sm mt-2"
        >
          🏆 英雄榜{hydrated && boardCount > 0 ? `（${boardCount}人在榜${topName ? "·榜首 " + topName : ""}）` : ""}
        </button>
      </div>

      {/* Share gate modal */}
      {showShareGate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔥</div>
              <h3 className="text-lg font-black text-title mb-1">
                今日挑战次数已用完
              </h3>
              <p className="text-sm text-secondary">
                你已经超过 80% 的玩家
                <br />
                想继续挑战更高收益？
              </p>
            </div>

            <div className="space-y-2">
              <button onClick={handleShareToUnlock} className="btn-raised text-sm">
                分享朋友圈 +1 次
              </button>
              <button onClick={() => setShowShareGate(false)} className="btn-raised-ghost text-sm">
                明天再玩
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-secondary/40 pb-1">v3.0.0-sim</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm font-black text-title">{value}</div>
      <div className="text-[10px] text-secondary mt-0.5">{label}</div>
    </div>
  );
}
