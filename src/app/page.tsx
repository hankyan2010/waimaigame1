"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG } from "@/lib/config";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { setupWxShare, setSharePlayerId } from "@/lib/wx-share";
import { CoinRain } from "@/components/CoinRain";
import { BrandBar } from "@/components/BrandBar";
import { playCoinSound } from "@/lib/sound";

export default function HomePage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [inviteToast, setInviteToast] = useState<string>("");
  const [showShareGate, setShowShareGate] = useState(false);
  const [coinKey, setCoinKey] = useState(0);
  const [showCoin, setShowCoin] = useState(false);

  const [boardCount, setBoardCount] = useState(0);
  const [topName, setTopName] = useState<string | null>(null);

  useEffect(() => {
    const resetParams = new URLSearchParams(window.location.search);
    if (resetParams.get("reset") === "1") {
      try { localStorage.removeItem("waimai-sim-progress"); } catch { /* ignore */ }
      window.location.replace(window.location.pathname);
      return;
    }

    setHydrated(true);
    track("page_view");
    fetchLeaderboard().then((board) => {
      setBoardCount(board.length);
      setTopName(board[0]?.displayName ?? null);
    });

    const pid = useGameStore.getState().ensurePlayerId();
    setSharePlayerId(pid);
    useGameStore.getState().refreshInviteCredits();

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      useGameStore.getState().recordInviteScan(ref);
      const cleanRefUrl = new URL(window.location.href);
      cleanRefUrl.searchParams.delete("ref");
      window.history.replaceState({}, "", cleanRefUrl.toString());
    }
    const inviter = params.get("invite");
    if (inviter) {
      const myId = useGameStore.getState().playerId;
      if (inviter !== myId) {
        useGameStore
          .getState()
          .recordInviteScan(inviter)
          .then((res) => {
            if (res.credited) {
              setInviteToast("✨ 你帮朋友增加了 1 次挑战机会");
              track("invite_scan_success", { inviter });
            } else if (res.reason === "duplicate") {
              setInviteToast("已经扫过这位朋友的码啦");
            }
          });
      }
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }

    setupWxShare();
  }, []);

  useEffect(() => {
    if (!inviteToast) return;
    const t = setTimeout(() => setInviteToast(""), 3500);
    return () => clearTimeout(t);
  }, [inviteToast]);

  const totalPlays = hydrated ? store.totalPlays : 0;
  const bestCash = hydrated ? store.bestFinalCash : 0;
  const bestDays = hydrated ? store.bestDaysSurvived : 0;
  const isNewUser = totalPlays === 0;

  const handleStart = () => {
    if (!store.canPlay()) {
      setShowShareGate(true);
      track("share_gate_shown");
      return;
    }
    store.startNewGame();
    router.push("/play");
    track("start_click");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-brand pt-8 pb-14 px-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-3"><BrandBar /></div>

          <h1 className="text-4xl font-black text-title leading-tight mb-2">
            外卖老板
            <br />
            <span className="text-4xl">生存挑战</span>
          </h1>

          <p className="text-lg text-title/70 leading-snug">
            ¥10000本金，每天4个决策，选错就倒闭
          </p>
          <p className="text-base text-red-600 font-black mt-1">
            ⚠️ 47%的玩家在第3天就倒闭了
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-6 space-y-3 relative z-10">
        {/* 老用户：最佳战绩 */}
        {hydrated && !isNewUser && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-black text-title">¥{bestCash.toLocaleString()}</div>
                <div className="text-xs text-secondary">最高现金</div>
              </div>
              <div>
                <div className="text-2xl font-black text-title">{bestDays}天</div>
                <div className="text-xs text-secondary">存活</div>
              </div>
              <div>
                <div className="text-2xl font-black text-title">{totalPlays}次</div>
                <div className="text-xs text-secondary">已挑战</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-6 pb-6 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        {hydrated && (
          <p className="text-center text-base text-secondary mb-2 font-bold">
            今日剩余 {store.remainingFreePlays()} 次
          </p>
        )}
        <button onClick={handleStart} className="btn-raised text-xl">
          {!hydrated
            ? "开始挑战"
            : isNewUser
            ? "🚀 开始首次挑战"
            : "🔥 再来一局"}
        </button>
        <button
          onClick={() => {
            track("view_leaderboard");
            router.push("/leaderboard");
          }}
          className="btn-raised-ghost text-base mt-2"
        >
          🏆 英雄榜{hydrated && boardCount > 0 ? `（${boardCount}人在榜${topName ? " · 榜首 " + topName : ""}）` : ""}
        </button>
      </div>

      {/* Toast */}
      {inviteToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-black/85 text-white text-base px-4 py-2.5 rounded-full shadow-lg">
          {inviteToast}
        </div>
      )}


      {showCoin && <CoinRain key={coinKey} />}

      {/* 次数用完 → 一个蒙版搞定：分享引导 + 解锁按钮 */}
      {showShareGate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          {/* 上半部分：分享引导指向右上角 */}
          <div className="flex justify-end p-4 pt-2">
            <div className="text-right">
              <div className="text-6xl animate-bounce">👆</div>
              <div className="bg-white rounded-2xl p-4 mt-2 max-w-[260px]">
                <p className="text-lg font-bold text-title mb-1">点右上角「...」</p>
                <p className="text-base text-secondary">转发给朋友，每人参与你再 +1 次</p>
              </div>
            </div>
          </div>

          {/* 下半部分：解锁按钮 */}
          <div className="flex-1" />
          <div className="px-6 pb-8">
            <div className="bg-white rounded-2xl p-5 max-w-sm mx-auto">
              <p className="text-center text-lg font-black text-title mb-3">
                今日免费次数已用完
              </p>
              <button
                onClick={() => {
                  // 加次数 + 直接开始游戏，不检查canPlay，因为我们刚加了
                  store.markSharedForExtraPlay();
                  setShowShareGate(false);
                  store.startNewGame();
                  router.push("/play");
                  track("start_click");
                }}
                className="btn-raised text-lg"
              >
                🔓 分享解锁，继续挑战
              </button>
              <button
                onClick={() => setShowShareGate(false)}
                className="text-base text-secondary/50 text-center w-full py-2 mt-2"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
