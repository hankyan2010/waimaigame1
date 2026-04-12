"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG, determinePlayerTag, generateDiagnosisReport } from "@/lib/config";
import { QUESTION_BANK } from "@/lib/questions";
import { track } from "@/lib/track";
import {
  canEnterLeaderboard,
  predictRank,
  submitEntry,
  fetchLeaderboard,
} from "@/lib/leaderboard";
import { setupWxShare } from "@/lib/wx-share";
import type { LeaderboardEntry } from "@/lib/types";
import { BrandBar } from "@/components/BrandBar";

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
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [showPosterOverlay, setShowPosterOverlay] = useState(false);
  const [showResourcePage, setShowResourcePage] = useState(false);
  const [wrongChoices, setWrongChoices] = useState<{ title: string; yourChoice: string }[]>([]);
  const posterRef = useRef<HTMLDivElement>(null);

  // Animation sequencing
  const [animStep, setAnimStep] = useState(0);
  const [displayProfit, setDisplayProfit] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [visibleRows, setVisibleRows] = useState(0);
  const animStarted = useRef(false);

  // Poster html2canvas generation
  useEffect(() => {
    if (!posterRef.current || posterImage) return;
    const timer = setTimeout(async () => {
      try {
        const { default: html2canvas } = await import("html2canvas-pro");
        const canvas = await html2canvas(posterRef.current!, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        });
        setPosterImage(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error("poster gen failed", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  });

  // Test mode + hydration
  useEffect(() => {
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const testMode = params.get("test");
    if (testMode && ["thrive", "bankrupt", "survive"].includes(testMode)) {
      const fakeCash = testMode === "thrive" ? 35000 : testMode === "bankrupt" ? -500 : 11500;
      const fakeDay = testMode === "bankrupt" ? 3 : 5;
      useGameStore.setState({
        phase: "result",
        state: { ...store.state, cash: fakeCash, day: fakeDay, exposure: 2500, enterConversion: 0.14, orderConversion: 0.22, avgPrice: 30, badReviewRate: 0.04 },
        endingType: testMode as "thrive" | "bankrupt" | "survive",
        playerTag: determinePlayerTag(testMode as "thrive" | "bankrupt" | "survive", { cash: fakeCash, day: fakeDay, exposure: 2500, enterConversion: 0.14, orderConversion: 0.22, avgPrice: 30, badReviewRate: 0.04 }, 5, 2000),
        diagnosisReport: generateDiagnosisReport(testMode as "thrive" | "bankrupt" | "survive", { cash: fakeCash, day: fakeDay, exposure: 2500, enterConversion: 0.14, orderConversion: 0.22, avgPrice: 30, badReviewRate: 0.04 }, [], 2000, 5),
        dailySummaries: [],
      });
    }
  }, []);

  // Track + leaderboard entry check
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
        // 不立刻弹输入框，等动画播完再弹（在animation sequence里控制）
      }
      setupWxShare();
    }
  }, [hydrated]);

  // Animation sequence controller
  useEffect(() => {
    if (!hydrated || !store.endingType || animStarted.current) return;
    animStarted.current = true;

    const profitTarget = store.state.cash - GAME_CONFIG.initialCash;

    // 提前算好答错的题
    const wrongs: { title: string; yourChoice: string }[] = [];
    for (const choice of store.choices) {
      const q = QUESTION_BANK.find(qq => qq.id === choice.questionId);
      if (!q) continue;
      const bestOpt = q.options.find(o => o.verdict?.startsWith("推荐"));
      const chosenOpt = q.options[choice.optionIndex];
      if (bestOpt && chosenOpt && chosenOpt.text !== bestOpt.text) {
        wrongs.push({ title: q.title, yourChoice: chosenOpt.text });
      }
    }
    setWrongChoices(wrongs);

    // Step 1: Banner pop-in (300ms)
    setTimeout(() => setAnimStep(1), 100);

    // Step 1b: Profit count-up animation (starts at 400ms, runs 500ms)
    setTimeout(() => {
      const duration = 500;
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        setDisplayProfit(Math.round(profitTarget * eased));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, 400);

    // Step 2: Confetti (at 900ms)
    setTimeout(() => setAnimStep(2), 900);

    // Step 3: Leaderboard (at 2900ms for thrive/bankrupt, 1400ms otherwise)
    const confettiDuration = store.endingType === "thrive" || store.endingType === "bankrupt" ? 2000 : 500;
    setTimeout(() => {
      setAnimStep(3);
      // Fetch leaderboard data
      fetchLeaderboard().then((entries) => {
        const currentProfit = store.state.cash - GAME_CONFIG.initialCash;
        // Find where the player would rank
        let playerRank = 1;
        for (const e of entries) {
          if (e.profit > currentProfit) playerRank++;
          else break;
        }
        // Get 2-3 above and 2-3 below
        const startIdx = Math.max(0, playerRank - 4); // 3 above
        const endIdx = Math.min(entries.length, playerRank + 2); // 3 below (including potential self)
        const nearbyEntries = entries.slice(startIdx, endIdx);

        setLeaderboardData(nearbyEntries);

        // Stagger rows in
        nearbyEntries.forEach((_, i) => {
          setTimeout(() => setVisibleRows((v) => v + 1), 100 * (i + 1));
        });
      });
    }, 900 + confettiDuration);

    // Step 4: Poster card (at step3 + 1000ms)
    setTimeout(() => setAnimStep(4), 900 + confettiDuration + 1000);

    // Step 5: Bottom buttons (at step4 + 500ms)
    setTimeout(() => setAnimStep(5), 900 + confettiDuration + 1500);

    // Step 6: 动画全部播完后1.5秒，弹输入名字弹窗或直接弹海报
    setTimeout(() => {
      const profitNow = store.state.cash - GAME_CONFIG.initialCash;
      const days = store.state.day;
      if (canEnterLeaderboard(profitNow, days)) {
        setPendingRank(predictRank(profitNow, days));
        setShowNameModal(true);
      } else {
        // 不能上榜，直接弹海报蒙版
        setShowPosterOverlay(true);
      }
    }, 900 + confettiDuration + 3000);
  }, [hydrated, store.endingType]);

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
    // 提交后弹海报蒙版
    setTimeout(() => setShowPosterOverlay(true), 500);
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

  const qrSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame"}/qrcode.png`;

  // Poster card gradient based on ending type
  const posterBg =
    store.endingType === "thrive"
      ? "linear-gradient(145deg, #FFF7E0 0%, #FFE8A0 50%, #FFD54F 100%)"
      : store.endingType === "bankrupt"
      ? "linear-gradient(145deg, #F0F0F5 0%, #D8D8E0 50%, #B0B0C0 100%)"
      : "linear-gradient(145deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)";

  const posterBorder =
    store.endingType === "thrive"
      ? "2px solid rgba(255, 183, 0, 0.3)"
      : store.endingType === "bankrupt"
      ? "2px solid rgba(120, 120, 140, 0.3)"
      : "2px solid rgba(76, 175, 80, 0.3)";

  // Result-specific CTA
  const ctaConfig = isBankrupt
    ? { emoji: "💀", text: "你踩了不少坑，扫码领避坑指南" }
    : store.endingType === "thrive"
    ? { emoji: "🚀", text: "经营高手！扫码领高手专属资料" }
    : { emoji: "😐", text: "还有提升空间，扫码领经营秘籍" };

  // Banner config per ending
  const bannerConfig = store.endingType === "thrive"
    ? { text: "🎉 恭喜爆赚！", bgClass: "result-banner-thrive" }
    : store.endingType === "bankrupt"
    ? { text: "💀 倒闭了...", bgClass: "result-banner-bankrupt" }
    : { text: "😐 勉强存活", bgClass: "result-banner-survive" };

  // Figure out player's rank in leaderboard data for highlighting
  const currentProfit = profit;
  const playerRankInBoard = (() => {
    let rank = 1;
    for (const e of leaderboardData) {
      if (e.profit > currentProfit) rank++;
      else break;
    }
    return rank;
  })();

  // Confetti particles
  const renderConfetti = () => {
    if (animStep < 2) return null;
    if (store.endingType === "thrive") {
      // Gold/red confetti celebration
      const particles = Array.from({ length: 30 }, (_, i) => {
        const colors = ["#FFD100", "#FF6B35", "#EF4444", "#FFB700", "#16A34A", "#FF9500"];
        const color = colors[i % colors.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.5 + Math.random() * 1.5;
        const size = 6 + Math.random() * 8;
        const rotation = Math.random() * 360;
        return (
          <div
            key={i}
            className="result-confetti-particle"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      });
      return <div className="result-confetti-container">{particles}</div>;
    }
    if (store.endingType === "bankrupt") {
      // Gray rain
      const particles = Array.from({ length: 20 }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1;
        const duration = 2 + Math.random() * 1.5;
        return (
          <div
            key={i}
            className="result-confetti-particle"
            style={{
              left: `${left}%`,
              width: 4,
              height: 4,
              background: "#999",
              opacity: 0.4,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              borderRadius: "50%",
            }}
          />
        );
      });
      return <div className="result-confetti-container">{particles}</div>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col" style={{ maxWidth: 430, margin: "0 auto" }}>
      {/* Confetti overlay */}
      {renderConfetti()}

      {/* Content */}
      <div className="flex-1 px-4 pt-6 space-y-4 relative z-10">
        <div className="mb-2"><BrandBar /></div>

        {/* ===== Step 1: Pop-up Banner ===== */}
        {animStep >= 1 && (
          <div className="text-center">
            <div className={`inline-block px-8 py-3 rounded-2xl result-pop-in-back ${bannerConfig.bgClass}`}>
              <span className="text-2xl font-black">{bannerConfig.text}</span>
            </div>
            {/* Profit count-up */}
            <div className="mt-3">
              <p className="text-sm text-secondary">{daysSurvived}天经营利润</p>
              <div
                className="text-[48px] font-black leading-none mt-1"
                style={{ color: isBankrupt ? "#666" : displayProfit >= 0 ? "#16a34a" : "#dc2626" }}
              >
                {displayProfit >= 0 ? "+" : ""}&yen;{displayProfit.toLocaleString()}
              </div>
              <p className="text-sm text-secondary mt-1">
                打败了{beatPercent}%的外卖老板
              </p>
            </div>
          </div>
        )}

        {/* ===== Step 3: Leaderboard Comparison ===== */}
        {animStep >= 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm result-stagger-slide-up">
            <h3 className="text-lg font-black text-title mb-3">{"📊"} 排行榜</h3>
            <div className="space-y-1.5">
              {leaderboardData.length === 0 && (
                <p className="text-sm text-secondary text-center py-3">加载中...</p>
              )}
              {leaderboardData.map((entry, idx) => {
                // Determine the global rank
                // Find global index: the entry's position in sorted leaderboard
                const isCurrentPlayer = entry.profit <= currentProfit &&
                  (idx === 0 || leaderboardData[idx - 1].profit > currentProfit);
                const globalRank = idx + 1;
                const tagEmoji = TAG_INFO[entry.tag]?.emoji ?? "🏪";
                const isVisible = idx < visibleRows;

                return (
                  <div
                    key={entry.id || idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                    style={{
                      background: isCurrentPlayer ? "#A5C15D" : idx % 2 === 0 ? "#F9F9F9" : "white",
                      color: isCurrentPlayer ? "white" : undefined,
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "translateY(0)" : "translateY(20px)",
                      transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
                    }}
                  >
                    <span className="text-base font-black w-7 text-center" style={{ color: isCurrentPlayer ? "white" : "#999" }}>
                      {globalRank}
                    </span>
                    <span className="text-lg">{tagEmoji}</span>
                    <span className="flex-1 text-base font-bold truncate" style={{ color: isCurrentPlayer ? "white" : "#333" }}>
                      {entry.displayName.length > 8 ? entry.displayName.slice(0, 8) + "..." : entry.displayName}
                    </span>
                    <span className="text-base font-black" style={{ color: isCurrentPlayer ? "white" : entry.profit >= 0 ? "#16a34a" : "#dc2626" }}>
                      {entry.profit >= 0 ? "+" : ""}&yen;{entry.profit.toLocaleString()}
                    </span>
                  </div>
                );
              })}

              {/* If player isn't in leaderboard data, show their row */}
              {leaderboardData.length > 0 && !leaderboardData.some(e => e.profit <= currentProfit) && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "#A5C15D",
                    opacity: visibleRows > leaderboardData.length ? 1 : 0,
                    transform: visibleRows > leaderboardData.length ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
                  }}
                >
                  <span className="text-base font-black w-7 text-center text-white">--</span>
                  <span className="text-lg">{tag.emoji}</span>
                  <span className="flex-1 text-base font-bold truncate text-white">
                    {store.displayName || "👈 你"}
                  </span>
                  <span className="text-base font-black text-white">
                    {profit >= 0 ? "+" : ""}&yen;{profit.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Step 3.5: 答错题复盘 + 扫码解锁 ===== */}
        {animStep >= 4 && (() => {
          const totalQuestions = store.choices.length;
          const showWrongs = wrongChoices.slice(0, 3);

          return wrongChoices.length > 0 ? (
            <div className="rounded-2xl p-5 shadow-sm result-stagger-slide-up"
              style={{ background: "linear-gradient(135deg, #FFF5F5 0%, #FED7D7 100%)", border: "2px solid #FEB2B2" }}>
              <p className="text-xl font-black text-red-600 mb-3">
                ❌ 你踩了 {wrongChoices.length} 个坑（共{totalQuestions}题）
              </p>

              <div className="space-y-3 mb-4">
                {showWrongs.map((w, i) => (
                  <div key={i} className="bg-white/80 rounded-xl p-3">
                    <p className="text-base font-black text-title mb-1">{w.title}</p>
                    <p className="text-sm text-red-500">你选了：{w.yourChoice}</p>
                    <p className="text-sm text-secondary">正确答案：<span className="font-black">🔒 扫码解锁</span></p>
                  </div>
                ))}
                {wrongChoices.length > 3 && (
                  <p className="text-sm text-secondary text-center">
                    还有 {wrongChoices.length - 3} 个坑未显示...
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSrc}
                    alt="扫码解锁"
                    className="w-28 h-28 rounded-xl"
                  />
                </div>
                <p className="text-lg font-black text-title mb-1">
                  📚 扫码解锁全部正确答案
                </p>
                <p className="text-base text-secondary mb-1">
                  100题知识点 + 经营避坑指南
                </p>
                <p className="text-sm text-red-500 font-bold">
                  已有 3,000+ 外卖老板领取
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 shadow-sm result-stagger-slide-up"
              style={{ background: "linear-gradient(135deg, #F0FFF4 0%, #C6F6D5 100%)", border: "2px solid #9AE6B4" }}>
              <p className="text-xl font-black text-green-600 mb-3">
                🎯 全对！你答对了全部 {totalQuestions} 题
              </p>
              <div className="bg-white rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrSrc}
                    alt="扫码领取"
                    className="w-28 h-28 rounded-xl"
                  />
                </div>
                <p className="text-lg font-black text-title mb-1">
                  🏆 扫码领高手专属资料包
                </p>
                <p className="text-base text-secondary">
                  100题完整知识库 + 高级经营策略
                </p>
              </div>
            </div>
          );
        })()}

        {/* ===== Step 4: Poster Card ===== */}
        {animStep >= 4 && (
          <div className="result-stagger-slide-up">
            <p className="text-center text-base text-secondary mb-2">
              {"👇"} 长按海报保存，发给朋友
            </p>

            {/* If poster image generated, show saveable img */}
            {posterImage && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterImage}
                  alt="我的经营人格海报"
                  className="w-full rounded-2xl shadow-lg"
                  style={{ maxWidth: 400 }}
                />
              </div>
            )}

            {/* HTML poster source (hidden offscreen once image generated) */}
            <div style={posterImage ? { position: "absolute", left: "-9999px", top: 0 } : {}}>
              <div
                ref={posterRef}
                className="rounded-3xl p-6 text-center"
                style={{
                  background: posterBg,
                  border: posterBorder,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <p className="text-base font-bold mb-4" style={{ color: "#888" }}>
                  {"🏪"} 外卖老板生存挑战
                </p>

                <div className="text-7xl mb-2">{tag.emoji}</div>
                <h3 className="text-4xl font-black mb-3" style={{ color: "#222" }}>{tag.label}</h3>

                <p className="text-lg leading-relaxed mb-4 px-1" style={{ color: "#444" }}>
                  {tag.desc}
                </p>

                <div className="border-t border-black/10 mx-4 mb-4" />

                <p className="text-sm mb-1" style={{ color: "#999" }}>
                  {daysSurvived}天经营利润
                </p>
                <div className="text-[48px] font-black leading-none mb-1" style={{ color: isBankrupt ? "#666" : profit >= 0 ? "#16a34a" : "#dc2626" }}>
                  {profit >= 0 ? "+" : ""}&yen;{profit.toLocaleString()}
                </div>
                <p className="text-sm mb-5" style={{ color: "#aaa" }}>
                  打败了{beatPercent}%的外卖老板
                </p>

                <div className="border-t border-black/10 mx-4 mb-4" />

                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame"}/game-qr.png`}
                    alt="扫码挑战"
                    className="w-24 h-24 rounded-xl"
                  />
                  <p className="text-base font-black" style={{ color: "#333" }}>扫码测测你是什么经营人格</p>
                  <p className="text-xs" style={{ color: "#999" }}>waimaiketang.com/oldgame</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* (旧CTA已合并到答错题卡片中) */}

        {/* ===== Diagnosis (folded) ===== */}
        {animStep >= 4 && store.diagnosisReport && (
          <>
            <button
              onClick={() => setShowDiagnosis(!showDiagnosis)}
              className="bg-white rounded-2xl p-4 shadow-sm w-full text-left result-stagger-slide-up"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-title">{"📊"} 你的经营诊断</span>
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
                <div className="pt-3 border-t border-border">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl flex-shrink-0">{"💡"}</span>
                    <p className="text-lg font-bold text-body leading-relaxed">{store.diagnosisReport.summary}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 5-day ledger (folded) */}
        {animStep >= 4 && (
          <>
            <button
              onClick={() => setShowLedger(!showLedger)}
              className="bg-white rounded-2xl p-4 shadow-sm w-full text-left result-stagger-slide-up"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-title">{"📒"} 5天经营账本</span>
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
                        {d.profit >= 0 ? "+" : ""}&yen;{d.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2 text-sm text-secondary">
                      <span>营业 &yen;{d.incomeRevenue}</span>
                      <span>&middot;</span>
                      <span>成本 &yen;{d.fixedCost}</span>
                      <span>&middot;</span>
                      <span>决策 {d.choiceImpact >= 0 ? "+" : ""}&yen;{d.choiceImpact}</span>
                    </div>
                    <p className="text-base text-body leading-snug mt-1">{"💡"} {d.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA - Step 5 */}
      {animStep >= 5 && (
        <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-neutral-100 via-neutral-100 to-transparent result-fade-in">
          <div className="space-y-2">
            {submittedRank !== null && (
              <div className="text-center text-base text-title font-black">
                {"🎉"} 已上榜 第 {submittedRank} 名
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handlePlayAgain} className="btn-raised-ghost text-base">
                {"🔥"} 再来一局
              </button>
              <button onClick={() => router.push("/leaderboard")} className="btn-raised-ghost text-base">
                {"🏆"} 查看完整排行榜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 100 name modal */}
      {showNameModal && pendingRank !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{"🏆"}</div>
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
              <button onClick={() => {
                setShowNameModal(false);
                setTimeout(() => setShowPosterOverlay(true), 500);
              }} className="btn-raised-ghost text-base">
                算了不留
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 海报蒙版 ===== */}
      {showPosterOverlay && (
        <div className="fixed inset-0 bg-black/90 z-[80] flex flex-col items-center justify-center px-4">
          <p className="text-white text-lg font-black mb-3 animate-bounce">
            👇 长按海报保存，分享朋友圈
          </p>

          {posterImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterImage}
              alt="我的经营人格海报"
              className="w-full rounded-2xl shadow-2xl"
              style={{ maxWidth: 360 }}
            />
          ) : (
            <div className="text-white text-base">海报生成中...</div>
          )}

          <div className="w-full max-w-[360px] mt-4">
            <button
              onClick={() => {
                setShowPosterOverlay(false);
                setShowResourcePage(true);
                track("poster_to_resource");
              }}
              className="btn-raised text-lg w-full"
            >
              继续 →
            </button>
          </div>
        </div>
      )}

      {/* ===== 领资料全屏页 — 海报关闭后展示 ===== */}
      {showResourcePage && (
        <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
          <div className="max-w-[430px] mx-auto px-4 py-6">
            {/* 顶部标题 */}
            <div className="text-center mb-6">
              <p className="text-3xl font-black text-title mb-2">🎁 你的专属资料包</p>
              <p className="text-lg text-secondary">扫码免费领取，30秒发你</p>
            </div>

            {/* 答错题回顾 */}
            {wrongChoices.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4">
                <p className="text-lg font-black text-red-600 mb-2">
                  ❌ 你踩了 {wrongChoices.length} 个坑
                </p>
                <div className="space-y-1 mb-2">
                  {wrongChoices.slice(0, 3).map((w, i) => (
                    <p key={i} className="text-sm text-red-500">
                      • {w.title}：你选了「{w.yourChoice}」
                    </p>
                  ))}
                  {wrongChoices.length > 3 && (
                    <p className="text-sm text-secondary">还有 {wrongChoices.length - 3} 个坑...</p>
                  )}
                </div>
                <p className="text-base font-black text-title">
                  🔒 正确答案在资料包里，扫码解锁 ↓
                </p>
              </div>
            )}

            {/* 资料包内容清单 */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 mb-4">
              <p className="text-xl font-black text-title mb-4">📦 资料包包含：</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">📚</span>
                  <div>
                    <p className="text-base font-black text-title">全部100题正确答案+知识点</p>
                    <p className="text-sm text-secondary">每道题的最优选择和背后逻辑</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-base font-black text-title">菜单定价公式表</p>
                    <p className="text-sm text-secondary">主食引流+福利品赚利润的定价模型</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-base font-black text-title">差评处理话术30条</p>
                    <p className="text-sm text-secondary">拿来就能用，覆盖90%的差评场景</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-base font-black text-title">推广ROI计算器</p>
                    <p className="text-sm text-secondary">一表算清点金/满减到底划不划算</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="text-base font-black text-title">新店7天冷启动SOP</p>
                    <p className="text-sm text-secondary">从0到100单的完整操作手册</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-base font-black text-title">1次资深专家一对一诊断</p>
                    <p className="text-sm text-secondary">针对你的店铺数据，给出具体改进方案</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 大QR码 */}
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-brand shadow-lg mb-4">
              <p className="text-2xl font-black text-title mb-1">👇 扫码免费领取</p>
              <p className="text-base text-secondary mb-4">加微信回复「资料包」，30秒发你</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="扫码领取"
                className="w-40 h-40 mx-auto rounded-xl mb-3"
              />
              <p className="text-lg font-black text-red-500">全部免费 · 已有 3,000+ 老板领取</p>
            </div>

            {/* 底部按钮 */}
            <div className="space-y-2 pb-4">
              <button onClick={handlePlayAgain} className="btn-raised text-lg w-full">
                🔥 再来一局
              </button>
              <button
                onClick={() => {
                  setShowResourcePage(false);
                  router.push("/leaderboard");
                }}
                className="btn-raised-ghost text-base w-full"
              >
                🏆 查看排行榜
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
