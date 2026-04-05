"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { SharePoster } from "@/components/SharePoster";

const BASE = "/waimai-game";

export default function RewardPage() {
  const router = useRouter();
  const store = useGameStore();
  const { answers, resultLevel, reset, storeState, bestScore, bestRank } = store;
  const level = resultLevel();

  const [showPoster, setShowPoster] = useState(false);

  const storeLevel = Object.values(storeState).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (answers.length === 0) {
      router.push("/");
    }
  }, [answers, router]);

  if (answers.length === 0) return null;

  const handleReplay = () => {
    reset();
    router.push("/");
  };

  const handleShareConfirm = () => {
    store.markSharedForNextRound();
    setShowPoster(false);
  };

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
            <span className="text-xs font-medium text-title">
              经营福利已解锁
            </span>
          </div>
          <h1 className="text-2xl font-black text-title leading-tight">
            🎁 恭喜 · {level.title}
          </h1>
          <p className="text-sm text-title/70 mt-1">
            你的专属经营福利已备好
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10">

        {/* QR code + reward list side by side */}
        <div className="flex gap-3">
          {/* QR code */}
          <div className="bg-card rounded-2xl p-3 shadow-sm text-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/qrcode.png`}
              alt="扫码加微信"
              className="w-28 h-28 mx-auto rounded-lg"
            />
            <p className="text-[11px] text-secondary mt-1.5 leading-tight">
              扫码加微信<br />备注「答题福利」
            </p>
          </div>

          {/* Reward list */}
          <div className="bg-card rounded-2xl p-3 shadow-sm flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📊</span>
              <p className="text-sm font-bold text-title">实战资料包</p>
            </div>
            <div className="space-y-1.5">
              {[
                "经营核心指标清单",
                "菜单优化实操手册",
                "评价运营SOP",
                "流量投放ROI表",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="text-success text-xs">✓</span>
                  <span className="text-xs text-body">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgency bar */}
        <div className="bg-warning/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-warning text-xs">⏰</span>
          <p className="text-xs text-body">福利名额有限，尽快领取</p>
        </div>

        {/* Share poster section */}
        <div className="bg-card rounded-2xl p-4 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-base">📣</span>
            <p className="text-sm font-bold text-title">邀请好友来挑战</p>
          </div>
          <p className="text-xs text-secondary mb-3">
            生成海报发朋友圈，看看谁的经营水平更高
          </p>
          <button
            onClick={() => setShowPoster(true)}
            className="w-full py-3 bg-brand text-title text-sm font-bold rounded-xl active:scale-[0.98] transition-transform"
          >
            生成分享海报
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          onClick={handleReplay}
          className="w-full py-4 bg-card border border-border text-body text-base font-bold rounded-2xl active:scale-[0.98] transition-transform"
        >
          再来一次挑战
        </button>
      </div>

      {/* Share poster modal */}
      {showPoster && (
        <SharePoster
          score={bestScore}
          rank={bestRank || "青铜掌柜"}
          storeLevel={storeLevel}
          storeState={storeState}
          onClose={() => setShowPoster(false)}
          onConfirmShared={handleShareConfirm}
        />
      )}
    </div>
  );
}
