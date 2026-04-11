"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG, determinePlayerTag, generateDiagnosisReport } from "@/lib/config";
import { track } from "@/lib/track";
import {
  canEnterLeaderboard,
  predictRank,
  submitEntry,
  fetchLeaderboard,
} from "@/lib/leaderboard";
import { setupWxShare } from "@/lib/wx-share";
import type { LeaderboardEntry } from "@/lib/types";

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

    // Step 6: 动画全部播完后1.5秒，再弹输入名字的弹窗
    setTimeout(() => {
      const profitNow = store.state.cash - GAME_CONFIG.initialCash;
      const days = store.state.day;
      if (canEnterLeaderboard(profitNow, days)) {
        setPendingRank(predictRank(profitNow, days));
        setShowNameModal(true);
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
    ? { emoji: "\u{1F480}", text: "\u4F60\u8E29\u4E86\u4E0D\u5C11\u5751\uFF0C\u626B\u7801\u9886\u907F\u5751\u6307\u5357" }
    : store.endingType === "thrive"
    ? { emoji: "\u{1F680}", text: "\u7ECF\u8425\u9AD8\u624B\uFF01\u626B\u7801\u9886\u9AD8\u624B\u4E13\u5C5E\u8D44\u6599" }
    : { emoji: "\u{1F610}", text: "\u8FD8\u6709\u63D0\u5347\u7A7A\u95F4\uFF0C\u626B\u7801\u9886\u7ECF\u8425\u79D8\u7C4D" };

  // Banner config per ending
  const bannerConfig = store.endingType === "thrive"
    ? { text: "\u{1F389} \u606D\u559C\u7206\u8D5A\uFF01", bgClass: "result-banner-thrive" }
    : store.endingType === "bankrupt"
    ? { text: "\u{1F480} \u5012\u95ED\u4E86...", bgClass: "result-banner-bankrupt" }
    : { text: "\u{1F610} \u52C9\u5F3A\u5B58\u6D3B", bgClass: "result-banner-survive" };

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

        {/* ===== Step 1: Pop-up Banner ===== */}
        {animStep >= 1 && (
          <div className="text-center">
            <div className={`inline-block px-8 py-3 rounded-2xl result-pop-in-back ${bannerConfig.bgClass}`}>
              <span className="text-2xl font-black">{bannerConfig.text}</span>
            </div>
            {/* Profit count-up */}
            <div className="mt-3">
              <p className="text-sm text-secondary">{daysSurvived}\u5929\u7ECF\u8425\u5229\u6DA6</p>
              <div
                className="text-[48px] font-black leading-none mt-1"
                style={{ color: isBankrupt ? "#666" : displayProfit >= 0 ? "#16a34a" : "#dc2626" }}
              >
                {displayProfit >= 0 ? "+" : ""}&yen;{displayProfit.toLocaleString()}
              </div>
              <p className="text-sm text-secondary mt-1">
                \u6253\u8D25\u4E86{beatPercent}%\u7684\u5916\u5356\u8001\u677F
              </p>
            </div>
          </div>
        )}

        {/* ===== Step 3: Leaderboard Comparison ===== */}
        {animStep >= 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm result-stagger-slide-up">
            <h3 className="text-lg font-black text-title mb-3">{"\u{1F4CA}"} \u6392\u884C\u699C</h3>
            <div className="space-y-1.5">
              {leaderboardData.length === 0 && (
                <p className="text-sm text-secondary text-center py-3">\u52A0\u8F7D\u4E2D...</p>
              )}
              {leaderboardData.map((entry, idx) => {
                // Determine the global rank
                // Find global index: the entry's position in sorted leaderboard
                const isCurrentPlayer = entry.profit <= currentProfit &&
                  (idx === 0 || leaderboardData[idx - 1].profit > currentProfit);
                const globalRank = idx + 1;
                const tagEmoji = TAG_INFO[entry.tag]?.emoji ?? "\u{1F3EA}";
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

        {/* ===== Step 4: Poster Card ===== */}
        {animStep >= 4 && (
          <div className="result-stagger-slide-up">
            <p className="text-center text-base text-secondary mb-2">
              {"\u{1F447}"} \u957F\u6309\u6D77\u62A5\u4FDD\u5B58\uFF0C\u53D1\u7ED9\u670B\u53CB
            </p>

            {/* If poster image generated, show saveable img */}
            {posterImage && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterImage}
                  alt="\u6211\u7684\u7ECF\u8425\u4EBA\u683C\u6D77\u62A5"
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
                  {"\u{1F3EA}"} \u5916\u5356\u8001\u677F\u751F\u5B58\u6311\u6218
                </p>

                <div className="text-7xl mb-2">{tag.emoji}</div>
                <h3 className="text-4xl font-black mb-3" style={{ color: "#222" }}>{tag.label}</h3>

                <p className="text-lg leading-relaxed mb-4 px-1" style={{ color: "#444" }}>
                  {tag.desc}
                </p>

                <div className="border-t border-black/10 mx-4 mb-4" />

                <p className="text-sm mb-1" style={{ color: "#999" }}>
                  {daysSurvived}\u5929\u7ECF\u8425\u5229\u6DA6
                </p>
                <div className="text-[48px] font-black leading-none mb-1" style={{ color: isBankrupt ? "#666" : profit >= 0 ? "#16a34a" : "#dc2626" }}>
                  {profit >= 0 ? "+" : ""}&yen;{profit.toLocaleString()}
                </div>
                <p className="text-sm mb-5" style={{ color: "#aaa" }}>
                  \u6253\u8D25\u4E86{beatPercent}%\u7684\u5916\u5356\u8001\u677F
                </p>

                <div className="border-t border-black/10 mx-4 mb-4" />

                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame"}/game-qr.png`}
                    alt="\u626B\u7801\u6311\u6218"
                    className="w-24 h-24 rounded-xl"
                  />
                  <p className="text-base font-black" style={{ color: "#333" }}>\u626B\u7801\u6D4B\u6D4B\u4F60\u662F\u4EC0\u4E48\u7ECF\u8425\u4EBA\u683C</p>
                  <p className="text-xs" style={{ color: "#999" }}>waimaiketang.com/oldgame</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result-specific CTA */}
        {animStep >= 4 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm result-stagger-slide-up">
            <div className="flex gap-3 items-center">
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="\u626B\u7801\u9886\u53D6"
                  className="w-16 h-16 rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-title">
                  {ctaConfig.emoji} {ctaConfig.text}
                </p>
                <p className="text-sm text-secondary mt-0.5">\u52A0\u5FAE\u4FE1\u56DE\u590D\u300C\u8D44\u6599\u5305\u300D\u514D\u8D39\u9886</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Diagnosis (folded) ===== */}
        {animStep >= 4 && store.diagnosisReport && (
          <>
            <button
              onClick={() => setShowDiagnosis(!showDiagnosis)}
              className="bg-white rounded-2xl p-4 shadow-sm w-full text-left result-stagger-slide-up"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-title">{"\u{1F4CA}"} \u4F60\u7684\u7ECF\u8425\u8BCA\u65AD</span>
                <span className="text-base text-secondary">{showDiagnosis ? "\u6536\u8D77 \u2191" : "\u5C55\u5F00 \u2193"}</span>
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
                        }`}>{dim.score}\u5206</span>
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
                    <span className="text-2xl flex-shrink-0">{"\u{1F4A1}"}</span>
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
                <span className="text-lg font-black text-title">{"\u{1F4D2}"} 5\u5929\u7ECF\u8425\u8D26\u672C</span>
                <span className="text-base text-secondary">{showLedger ? "\u6536\u8D77 \u2191" : "\u5C55\u5F00 \u2193"}</span>
              </div>
            </button>

            {showLedger && (
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                {store.dailySummaries.map((d) => (
                  <div key={d.day} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-black text-title">\u7B2C{d.day}\u5929</span>
                      <span className={`text-xl font-black ${d.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {d.profit >= 0 ? "+" : ""}&yen;{d.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2 text-sm text-secondary">
                      <span>\u8425\u4E1A &yen;{d.incomeRevenue}</span>
                      <span>&middot;</span>
                      <span>\u6210\u672C &yen;{d.fixedCost}</span>
                      <span>&middot;</span>
                      <span>\u51B3\u7B56 {d.choiceImpact >= 0 ? "+" : ""}&yen;{d.choiceImpact}</span>
                    </div>
                    <p className="text-base text-body leading-snug mt-1">{"\u{1F4A1}"} {d.comment}</p>
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
                {"\u{1F389}"} \u5DF2\u4E0A\u699C \u7B2C {submittedRank} \u540D
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handlePlayAgain} className="btn-raised-ghost text-base">
                {"\u{1F525}"} \u518D\u6765\u4E00\u5C40
              </button>
              <button onClick={() => router.push("/leaderboard")} className="btn-raised-ghost text-base">
                {"\u{1F3C6}"} \u67E5\u770B\u5B8C\u6574\u6392\u884C\u699C
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
              <div className="text-5xl mb-2">{"\u{1F3C6}"}</div>
              <h3 className="text-2xl font-black text-title mb-2">
                \u606D\u559C\u8FDB\u5165\u82F1\u96C4\u699C \u7B2C {pendingRank} \u540D
              </h3>
              <p className="text-lg text-secondary">
                \u7559\u4E0B\u4F60\u7684\u5E97\u94FA\u540D\uFF0C\u8BA9\u5176\u4ED6\u73A9\u5BB6\u770B\u89C1\u4F60
              </p>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="\u5E97\u94FA\u540D / \u6635\u79F0\uFF082~20\u5B57\uFF09"
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-lg text-title mb-3 focus:border-brand outline-none"
            />
            <div className="space-y-2">
              <button
                onClick={handleSubmitName}
                disabled={nameInput.trim().length < 2}
                className="btn-raised text-lg disabled:opacity-40"
              >
                \u4E0A\u699C\u7559\u540D
              </button>
              <button onClick={() => setShowNameModal(false)} className="btn-raised-ghost text-base">
                \u7B97\u4E86\u4E0D\u7559
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share tip overlay */}
      {showShareTip && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-start justify-end p-4 pt-2"
             onClick={() => setShowShareTip(false)}>
          <div className="text-right mt-0">
            <div className="text-6xl animate-bounce">{"\u{1F446}"}</div>
            <div className="bg-white rounded-2xl p-5 mt-2 max-w-[260px]">
              <p className="text-lg font-bold text-title mb-1">\u70B9\u51FB\u53F3\u4E0A\u89D2\u300C...\u300D</p>
              <p className="text-base text-secondary">\u53D1\u7ED9\u670B\u53CB\u6765\u6311\u6218</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
