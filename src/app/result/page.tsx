"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG } from "@/lib/config";
import { track } from "@/lib/track";
import {
  canEnterLeaderboard,
  predictRank,
  submitEntry,
} from "@/lib/leaderboard";
import { setupWxShare } from "@/lib/wx-share";

export default function ResultPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingRank, setPendingRank] = useState<number | null>(null);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");

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

      const profitNow = store.state.cash - GAME_CONFIG.initialCash;
      const days = store.state.day;
      if (canEnterLeaderboard(profitNow, days)) {
        setPendingRank(predictRank(profitNow, days));
        setShowNameModal(true);
      }

      // 配置微信分享：D 风格成就晒值（封面静态、文案动态）
      const profitText =
        profitNow >= 0
          ? `净赚 ¥${profitNow.toLocaleString()}`
          : `亏 ¥${Math.abs(profitNow).toLocaleString()}`;
      const endingTitle = ENDING_INFO[store.endingType].title;
      const tagLabel = TAG_INFO[store.playerTag!].label;
      setupWxShare({
        title: `我经营外卖7天${profitText}，你能超过我吗？`,
        desc: `存活${days}天 · ${tagLabel} · 1万本金+7天经营，看看你能赚多少`,
      });
    }
  }, [hydrated]);

  const handleSubmitName = () => {
    const name = nameInput.trim().slice(0, 20);
    if (name.length < 2) return;
    if (!store.endingType || !store.playerTag) return;
    const profitNow = store.state.cash - GAME_CONFIG.initialCash;
    submitEntry({
      displayName: name,
      profit: profitNow,
      finalCash: store.state.cash,
      daysSurvived: store.state.day,
      ending: store.endingType,
      tag: store.playerTag,
    });
    store.setDisplayName(name);
    setSubmittedRank(predictRank(profitNow, store.state.day));
    setShowNameModal(false);
    track("leaderboard_submit", { rank: pendingRank });
  };

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
            七天经营结束
          </p>
          <h1 className="text-2xl font-black text-title mb-2">{ending.title}</h1>
          <div className="text-[44px] font-black text-title leading-none">
            {profit >= 0 ? "+" : ""}¥{profit}
          </div>
          <p className="text-xs text-title/60 mt-1">
            存活{daysSurvived}天 · 最终现金 ¥{finalCash}
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

        {store.diagnosisReport && (
          <div className="bg-card rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-bold text-title mb-3">📊 你的经营诊断</p>
            <div className="space-y-3">
              {store.diagnosisReport.dimensions.map((dim) => (
                <div key={dim.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-title">{dim.name}</span>
                    <span className={`text-xs font-black ${
                      dim.score >= 70 ? "text-green-600" : dim.score >= 45 ? "text-orange-500" : "text-red-500"
                    }`}>{dim.score}分</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        dim.score >= 70 ? "bg-green-500" : dim.score >= 45 ? "bg-orange-400" : "bg-red-400"
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">{dim.comment}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-sm font-bold text-body leading-relaxed">{store.diagnosisReport.summary}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Daily history - 完整账本 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-title mb-3">📒 7天经营账本</p>
          <div className="space-y-3">
            {store.dailySummaries.map((d) => (
              <div
                key={d.day}
                className="border-b border-border last:border-0 pb-3 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-title">第{d.day}天</span>
                  <span
                    className={`text-sm font-black ${
                      d.profit >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {d.profit >= 0 ? "+" : ""}¥{d.profit}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-secondary mb-1">
                  <span>营业 ¥{d.incomeRevenue}</span>
                  <span>成本 ¥{d.fixedCost}</span>
                  <span>决策 {d.choiceImpact >= 0 ? "+" : ""}¥{d.choiceImpact}</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[10px] text-secondary mb-1">
                  <span>曝光 {d.exposureEnd}</span>
                  <span>入店 {(d.enterConversionEnd * 100).toFixed(1)}%</span>
                  <span>下单 {(d.orderConversionEnd * 100).toFixed(1)}%</span>
                  <span>客单 ¥{d.avgPriceEnd}</span>
                  <span>差评 {(d.badReviewEnd * 100).toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-body leading-snug mt-1">💡 {d.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <div className="space-y-2">
          {submittedRank !== null && (
            <div className="text-center text-xs text-title font-bold">
              🎉 已上榜 第 {submittedRank} 名
            </div>
          )}
          <button onClick={handleGoReward} className="btn-raised text-base">
            {isBankrupt ? "看高手怎么做" : "领取经营福利"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => router.push("/leaderboard")}
              className="btn-raised-ghost text-sm"
            >
              查看英雄榜
            </button>
            <button onClick={handlePlayAgain} className="btn-raised-ghost text-sm">
              再来一局
            </button>
          </div>
        </div>
      </div>

      {/* Top 100 name capture modal */}
      {showNameModal && pendingRank !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-lg font-black text-title mb-1">
                恭喜进入英雄榜 第 {pendingRank} 名
              </h3>
              <p className="text-sm text-secondary">
                留下你的店铺名 / 称号，让其他玩家看见你
              </p>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="店铺名 / 昵称（2~20字）"
              maxLength={20}
              className="w-full px-3 py-3 rounded-xl border-2 border-border bg-white text-sm text-title mb-3 focus:border-brand outline-none"
            />
            <div className="space-y-2">
              <button
                onClick={handleSubmitName}
                disabled={nameInput.trim().length < 2}
                className="btn-raised text-sm disabled:opacity-40"
              >
                上榜留名
              </button>
              <button
                onClick={() => setShowNameModal(false)}
                className="btn-raised-ghost text-sm"
              >
                算了不留
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
