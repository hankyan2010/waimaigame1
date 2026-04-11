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
  const [showShareTip, setShowShareTip] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [showLedger, setShowLedger] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

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
      setupWxShare();
    }
  }, [hydrated]);

  const handleSubmitName = async () => {
    const name = nameInput.trim().slice(0, 20);
    if (name.length < 2) return;
    if (!store.endingType || !store.playerTag) return;
    const profitNow = store.state.cash - GAME_CONFIG.initialCash;
    const result = await submitEntry({
      displayName: name,
      profit: profitNow,
      finalCash: store.state.cash,
      daysSurvived: store.state.day,
      ending: store.endingType,
      tag: store.playerTag,
    });
    store.setDisplayName(name);
    setSubmittedRank(result.rank ?? predictRank(profitNow, store.state.day));
    setShowNameModal(false);
    track("leaderboard_submit", { rank: result.rank ?? pendingRank });
  };

  if (!hydrated || !store.endingType || !store.playerTag) return null;

  const ending = ENDING_INFO[store.endingType];
  const tag = TAG_INFO[store.playerTag];
  const finalCash = store.state.cash;
  const profit = finalCash - GAME_CONFIG.initialCash;
  const daysSurvived = store.state.day;
  const isBankrupt = store.endingType === "bankrupt";

  const beatPercent = isBankrupt
    ? Math.max(5, Math.min(30, 10 + Math.floor(finalCash / 500)))
    : Math.max(40, Math.min(95, 50 + Math.floor(profit / 200)));

  const handlePlayAgain = () => {
    track("replay_from_result");
    if (store.canPlay()) {
      store.startNewGame();
      router.push("/play");
    } else {
      store.reset();
      router.push("/");
    }
  };

  const handleGoReward = () => {
    track("go_reward");
    router.push("/reward");
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* ===== 第一视觉区：利润 + 人格（截图友好）===== */}
      <div
        className="pt-10 pb-16 px-6 rounded-b-[2rem] relative overflow-hidden"
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
          <div className="text-6xl mb-3 animate-bounce-in">{ending.emoji}</div>
          <p className={`text-base uppercase tracking-wider mb-1 ${isBankrupt ? "text-white/60" : "text-title/60"}`}>
            五天经营结束
          </p>
          <h1 className={`text-4xl font-black mb-3 ${isBankrupt ? "text-white" : "text-title"}`}>
            {ending.title}
          </h1>
          <div className={`text-[56px] font-black leading-none animate-number-pop ${isBankrupt ? "text-white" : "text-title"}`}>
            {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
          </div>
          <p className={`text-base mt-2 ${isBankrupt ? "text-white/60" : "text-title/60"}`}>
            存活{daysSurvived}天 · 最终现金 ¥{finalCash.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-8 space-y-4 relative z-10">
        {/* 分享引导（暴赚才显示）*/}
        {store.endingType === "thrive" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-lg font-black text-green-700 mb-1">🎉 你赚翻了！晒一下？</p>
            <p className="text-base text-secondary">点右上角「...」分享给朋友</p>
          </div>
        )}

        {/* 经营人格大卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="text-4xl mb-2">{tag.emoji}</div>
          <p className="text-base text-secondary mb-1">你的经营人格</p>
          <h3 className="text-3xl font-black text-title mb-2">{tag.label}</h3>
          <p className="text-base text-secondary leading-relaxed">{tag.desc}</p>
        </div>

        {/* 战胜百分比 */}
        <div className="bg-brand/10 rounded-2xl p-5 text-center">
          <p className="text-base text-secondary mb-1">你已经打败了</p>
          <div className="text-4xl font-black text-title">{beatPercent}%</div>
          <p className="text-base text-secondary">的外卖老板</p>
        </div>

        {/* ===== 第二视觉区：诊断（默认折叠）===== */}
        {store.diagnosisReport && (
          <>
            <button
              onClick={() => setShowDiagnosis(!showDiagnosis)}
              className="bg-white rounded-2xl p-4 shadow-sm w-full text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-title">📊 你的经营诊断</span>
                <span className="text-base text-secondary">{showDiagnosis ? "收起 ↑" : "展开 ↓"}</span>
              </div>
              {!showDiagnosis && (
                <div className="flex gap-2 mt-3">
                  {store.diagnosisReport.dimensions.map((dim) => (
                    <div key={dim.id} className="flex-1">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            dim.score >= 70 ? "bg-green-500" : dim.score >= 45 ? "bg-orange-400" : "bg-red-400"
                          }`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-secondary text-center mt-1">{dim.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </button>

            {showDiagnosis && (
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                {store.diagnosisReport.dimensions.map((dim) => (
                  <div key={dim.id}>
                    <button
                      onClick={() => setExpandedDim(expandedDim === dim.id ? null : dim.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-base font-black text-title">{dim.name}</span>
                        <span className={`text-base font-black ${
                          dim.score >= 70 ? "text-green-600" : dim.score >= 45 ? "text-orange-500" : "text-red-500"
                        }`}>{dim.score}分</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            dim.score >= 70 ? "bg-green-500" : dim.score >= 45 ? "bg-orange-400" : "bg-red-400"
                          }`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </button>
                    {expandedDim === dim.id && (
                      <p className="text-base text-secondary leading-relaxed mt-2 animate-knowledge-in">{dim.comment}</p>
                    )}
                  </div>
                ))}
                {/* 总结 */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <p className="text-lg font-bold text-body leading-relaxed">{store.diagnosisReport.summary}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 5天账本（折叠）*/}
        <button
          onClick={() => setShowLedger(!showLedger)}
          className="bg-white rounded-2xl p-4 shadow-sm w-full text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-title">📒 5天经营账本</span>
            <span className="text-base text-secondary">{showLedger ? "收起 ↑" : "展开 ↓"}</span>
          </div>
        </button>

        {showLedger && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            {store.dailySummaries.map((d) => (
              <div key={d.day} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-black text-title">第{d.day}天</span>
                  <span className={`text-xl font-black ${d.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {d.profit >= 0 ? "+" : ""}¥{d.profit.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2 text-sm text-secondary">
                  <span>营业 ¥{d.incomeRevenue}</span>
                  <span>·</span>
                  <span>成本 ¥{d.fixedCost}</span>
                  <span>·</span>
                  <span>决策 {d.choiceImpact >= 0 ? "+" : ""}¥{d.choiceImpact}</span>
                </div>
                <p className="text-base text-body leading-snug mt-1">💡 {d.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* QR码领资料 — 放最底部 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame"}/qrcode.png`}
                alt="扫码领取"
                className="w-24 h-24 rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-title mb-1">
                📦 免费领：定价公式+差评话术
              </p>
              <p className="text-2xl font-black text-red-600 mb-1">全部免费</p>
              <p className="text-base text-secondary leading-relaxed">
                扫码加微信，回复「资料包」30秒发你
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-neutral-100 via-neutral-100 to-transparent">
        <div className="space-y-2">
          {submittedRank !== null && (
            <div className="text-center text-base text-title font-black">
              🎉 已上榜 第 {submittedRank} 名
            </div>
          )}
          <button onClick={handleGoReward} className="btn-raised text-xl">
            {isBankrupt ? "📦 免费领避坑指南" : "📦 免费领全套资料包"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => router.push("/leaderboard")} className="btn-raised-ghost text-base">
              🏆 英雄榜
            </button>
            <button onClick={handlePlayAgain} className="btn-raised-ghost text-base">
              🔥 再来一局
            </button>
          </div>
        </div>
      </div>

      {/* Top 100 name modal */}
      {showNameModal && pendingRank !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🏆</div>
              <h3 className="text-2xl font-black text-title mb-2">
                恭喜进入英雄榜 第 {pendingRank} 名
              </h3>
              <p className="text-lg text-secondary">
                留下你的店铺名，让其他玩家看见你
              </p>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="店铺名 / 昵称（2~20字）"
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-lg text-title mb-3 focus:border-brand outline-none"
            />
            <div className="space-y-2">
              <button
                onClick={handleSubmitName}
                disabled={nameInput.trim().length < 2}
                className="btn-raised text-lg disabled:opacity-40"
              >
                上榜留名
              </button>
              <button onClick={() => setShowNameModal(false)} className="btn-raised-ghost text-base">
                算了不留
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分享引导 */}
      {showShareTip && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-start justify-end p-4 pt-2"
             onClick={() => setShowShareTip(false)}>
          <div className="text-right mt-0">
            <div className="text-6xl animate-bounce">👆</div>
            <div className="bg-white rounded-2xl p-5 mt-2 max-w-[260px]">
              <p className="text-lg font-bold text-title mb-1">点击右上角「...」</p>
              <p className="text-base text-secondary">发给朋友来挑战</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
