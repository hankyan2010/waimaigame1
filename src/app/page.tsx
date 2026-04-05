"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { SharePoster } from "@/components/SharePoster";
import { ShareGuide } from "@/components/ShareGuide";
import { track } from "@/lib/track";

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
  const remaining = hydrated ? store.remainingPlays() : 1;
  const storeLevel = hydrated
    ? Object.values(store.storeState).reduce((a, b) => a + b, 0)
    : 0;

  const handleStart = () => {
    if (canPlay) {
      router.push("/play");
    }
  };

  const handleShareConfirm = () => {
    store.markShared();
    setShowPoster(false);
    setShowGuide(true);
    track("share_confirm");
  };

  return (
    <div className="min-h-screen bg-brand flex flex-col px-4 pt-4 pb-4">
      {/* Header text */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center bg-black/10 px-3 py-1 rounded-full mb-2">
          <span className="text-xs font-medium text-title">外卖经营知识挑战</span>
        </div>
        <h1 className="text-xl font-black text-title leading-tight">
          10题测出你的
        </h1>
        <h1 className="text-2xl font-black text-title leading-tight">
          经营真本事
        </h1>
        <p className="text-xs text-title/70 mt-1 leading-snug">
          别再靠感觉做外卖了<br />答完 10 题，看看你到底懂多少
        </p>
      </div>

      {/* Cards area */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Reward hook card */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center text-lg">🎁</div>
            <div>
              <p className="text-sm font-bold text-title">完成挑战领福利</p>
              <p className="text-[11px] text-secondary">答题 + 养店，解锁你的专属经营福利</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: "📊", label: "经营诊断" },
              { icon: "📖", label: "实战攻略" },
              { icon: "🎯", label: "专属方案" },
            ].map((item) => (
              <div key={item.label} className="bg-brand/5 rounded-lg py-1.5 text-center">
                <div className="text-base mb-0.5">{item.icon}</div>
                <div className="text-[11px] text-secondary">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-sm font-bold text-title mb-2">挑战流程</p>
          <div className="flex items-center justify-between px-2">
            {[
              { step: "1", label: "随机10题" },
              { step: "2", label: "答题升级" },
              { step: "3", label: "段位评定" },
              { step: "4", label: "领取福利" },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 bg-brand rounded-full flex items-center justify-center text-xs font-bold text-title mb-0.5">
                    {item.step}
                  </div>
                  <span className="text-[11px] text-secondary">{item.label}</span>
                </div>
                {idx < 3 && <div className="w-5 h-[1px] bg-border mx-0.5 mb-3" />}
              </div>
            ))}
          </div>
        </div>

        {/* Rank preview */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-sm font-bold text-title mb-2">段位等你挑战</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { title: "青铜掌柜", range: "0-39分", color: "#CD7F32" },
              { title: "白银店长", range: "40-59分", color: "#C0C0C0" },
              { title: "黄金操盘手", range: "60-79分", color: "#FFD700" },
              { title: "王者掌门", range: "80-100分", color: "#FF4500" },
            ].map((rank) => (
              <div key={rank.title} className="bg-brand/5 rounded-lg px-2.5 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                <div>
                  <p className="text-xs font-bold text-title">{rank.title}</p>
                  <p className="text-[10px] text-secondary">{rank.range}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store progress */}
        {hydrated && storeLevel > 0 && (
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center text-lg">🏪</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-title">我的店铺 Lv.{storeLevel}</p>
                <p className="text-[11px] text-secondary">店铺等级</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-3">
        {canPlay ? (
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-brand-dark text-title text-base font-black rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-black/10"
          >
            {hydrated && remaining === 1 ? "今日剩余 1 次 · 立即开答" : "立即开答"}
          </button>
        ) : (
          <button
            onClick={() => setShowPoster(true)}
            className="w-full py-3.5 bg-brand-dark text-title text-base font-black rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-black/10"
          >
            分享海报，再答一次
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
