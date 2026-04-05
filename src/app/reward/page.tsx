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
    store.markShared();
    setShowPoster(false);
  };

  return (
    <div className="min-h-screen bg-brand flex flex-col px-4 pt-4 pb-4">
      {/* Header */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center bg-black/10 px-3 py-1 rounded-full mb-2">
          <span className="text-xs font-medium text-title">经营福利已解锁</span>
        </div>
        <h1 className="text-xl font-black text-title">🎁 恭喜 · {level.title}</h1>
        <p className="text-xs text-title/70 mt-0.5">你的专属经营福利已备好</p>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* QR + rewards */}
        <div className="flex gap-2">
          <div className="bg-white rounded-2xl p-2.5 shadow-sm text-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/qrcode.png`}
              alt="扫码加微信"
              className="w-24 h-24 mx-auto rounded-lg"
            />
            <p className="text-[10px] text-secondary mt-1 leading-tight">
              扫码加微信<br />备注「答题福利」
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">📊</span>
              <p className="text-xs font-bold text-title">实战资料包</p>
            </div>
            <div className="space-y-1">
              {["经营核心指标清单", "菜单优化实操手册", "评价运营SOP", "流量投放ROI表"].map((item) => (
                <div key={item} className="flex items-center gap-1">
                  <span className="text-success text-[10px]">✓</span>
                  <span className="text-[11px] text-body">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgency */}
        <div className="bg-white/60 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-warning text-xs">⏰</span>
          <p className="text-[11px] text-body">福利名额有限，尽快领取</p>
        </div>

        {/* Share section */}
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-xs font-bold text-title mb-1">📣 邀请好友来挑战</p>
          <p className="text-[11px] text-secondary mb-2">生成海报发朋友圈，看看谁的经营水平更高</p>
          <button
            onClick={() => setShowPoster(true)}
            className="w-full py-2.5 bg-brand text-title text-sm font-bold rounded-xl active:scale-[0.98] transition-transform"
          >
            生成分享海报
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-3">
        <button
          onClick={handleReplay}
          className="w-full py-3.5 bg-white text-body text-base font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-sm"
        >
          再来一次挑战
        </button>
      </div>

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
