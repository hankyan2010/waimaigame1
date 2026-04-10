"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG } from "@/lib/config";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { setupWxShare, setSharePlayerId } from "@/lib/wx-share";
import { CoinRain } from "@/components/CoinRain";
import { playCoinSound } from "@/lib/sound";

export default function HomePage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [inviteToast, setInviteToast] = useState<string>("");
  const [showShareGate, setShowShareGate] = useState(false);
  const [showShareTip, setShowShareTip] = useState(false);
  // 金币雨测试用
  const [coinKey, setCoinKey] = useState(0);
  const [showCoin, setShowCoin] = useState(false);
  const triggerTestCoin = () => {
    setCoinKey((k) => k + 1);
    setShowCoin(true);
    playCoinSound();
    setTimeout(() => setShowCoin(false), 2800);
  };

  const [boardCount, setBoardCount] = useState(0);
  const [topName, setTopName] = useState<string | null>(null);

  useEffect(() => {
    // 紧急重置通道：?reset=1 清 localStorage 然后跳回干净 URL
    // 用途：当 store schema 变动导致老用户被锁死时的自救入口
    const resetParams = new URLSearchParams(window.location.search);
    if (resetParams.get("reset") === "1") {
      try {
        localStorage.removeItem("waimai-sim-progress");
      } catch {
        /* ignore */
      }
      window.location.replace(window.location.pathname);
      return;
    }

    setHydrated(true);
    track("page_view");
    fetchLeaderboard().then((board) => {
      setBoardCount(board.length);
      setTopName(board[0]?.displayName ?? null);
    });

    // 确保有玩家 ID + 拉取邀请额度
    const pid = useGameStore.getState().ensurePlayerId();
    setSharePlayerId(pid);
    useGameStore.getState().refreshInviteCredits();

    // 检测 ?ref= 或 ?invite= 参数：如果是从别人分享链接进来，记录扫码事件
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
            } else if (res.reason === "self") {
              // silent
            }
          });
      }
      // 清掉 URL 参数避免刷新重复（不影响 hash router）
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }

    // D1 分享：老用户晒最佳战绩，新用户走悬念测试
    const s = useGameStore.getState();
    const hasRecord = s.totalPlays > 0 && s.bestFinalCash > 0;
    if (hasRecord) {
      const profit = s.bestFinalCash - GAME_CONFIG.initialCash;
      const profitText =
        profit >= 0 ? `净赚 ¥${profit.toLocaleString()}` : `亏 ¥${Math.abs(profit).toLocaleString()}`;
      setupWxShare();
    } else {
      setupWxShare();
    }
  }, []);

  // inviteToast 自动消失
  useEffect(() => {
    if (!inviteToast) return;
    const t = setTimeout(() => setInviteToast(""), 3500);
    return () => clearTimeout(t);
  }, [inviteToast]);

  const totalPlays = hydrated ? store.totalPlays : 0;
  const bestCash = hydrated ? store.bestFinalCash : 0;
  const bestDays = hydrated ? store.bestDaysSurvived : 0;

  const handleStart = () => {
    if (!store.canPlay()) {
      setShowShareGate(true);
      track("share_gate_shown");
      return;
    }
    store.reset();
    router.push("/play");
    track("start_click");
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
            <span className="text-[30px]">5天生存挑战</span>
          </h1>

          <p className="text-sm text-title/70 leading-snug max-w-[280px] mx-auto">
            1万本金起步，5天经营
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
        {hydrated && (
          <p className="text-center text-sm text-secondary mb-2">
            今日剩余 {store.remainingFreePlays()} 次
          </p>
        )}
        <button onClick={handleStart} className="btn-raised text-base">
          {!hydrated
            ? "开始挑战"
            : totalPlays === 0
            ? "开始首次挑战"
            : "再来一局"}
        </button>
        <button
          onClick={() => {
            track("view_leaderboard");
            router.push("/leaderboard");
          }}
          className="btn-raised-ghost text-sm mt-2"
        >
          🏆 英雄榜{hydrated && boardCount > 0 ? `（${boardCount}人在榜${topName ? "·榜首 " + topName : ""}）` : ""}
        </button>
      </div>

      {/* Invite scan toast */}
      {inviteToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-black/85 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          {inviteToast}
        </div>
      )}

      <p className="text-center text-[10px] text-secondary/40 pb-1">
        v4.2.0
      </p>

      {/* 金币雨层（被测试按钮触发） */}
      {showCoin && <CoinRain key={coinKey} />}

      {/* 次数用完蒙版 */}
      {showShareGate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-lg font-black text-title mb-1">
                {hydrated && store.bestFinalCash > 0
                  ? `你的最高纪录：¥${store.bestFinalCash - GAME_CONFIG.initialCash > 0 ? "+" : ""}${store.bestFinalCash - GAME_CONFIG.initialCash}`
                  : "今日免费次数已用完"}
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                发给朋友来挑战，看谁经营得更好！<br/>
                每个朋友参与，你还能额外获得1次机会
              </p>
            </div>

            {store.inviteScannerCount > 0 && (
              <div className="bg-brand/10 rounded-xl p-3 mb-4 text-center">
                <p className="text-xs text-secondary">已有 {store.inviteScannerCount} 位朋友参与挑战</p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => setShowShareTip(true)}
                className="btn-raised text-sm"
              >
                发给朋友来挑战
              </button>
              <button
                onClick={() => setShowShareGate(false)}
                className="text-xs text-secondary/50 text-center w-full py-1"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分享引导提示 */}
      {showShareTip && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-start justify-end p-4 pt-2"
             onClick={() => setShowShareTip(false)}>
          <div className="text-right mt-0">
            <div className="text-6xl animate-bounce">👆</div>
            <div className="bg-white rounded-2xl p-4 mt-2 max-w-[260px]">
              <p className="text-sm font-bold text-title mb-1">点击右上角「...」</p>
              <p className="text-xs text-secondary">选择「转发给朋友」或「分享到朋友圈」</p>
              <p className="text-xs text-secondary mt-2">每个朋友打开你的链接，你就多一次机会</p>
            </div>
          </div>
        </div>
      )}
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
