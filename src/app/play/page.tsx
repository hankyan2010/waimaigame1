"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG, DAY_STORIES } from "@/lib/config";
import type { OptionEffect } from "@/lib/types";
import { CoinRain } from "@/components/CoinRain";
import { playCoinSound } from "@/lib/sound";

interface PendingAnswer {
  optionIndex: number;
  optionText: string;
  effect: OptionEffect;
  knowledge: string;
  verdict?: string;
  realCase?: string;
}

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [pending, setPending] = useState<PendingAnswer | null>(null);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [coinKey, setCoinKey] = useState(0);
  const [showCoin, setShowCoin] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);
  const [animatedCash, setAnimatedCash] = useState<number | null>(null);
  const prevCashRef = useRef<number>(0);

  const triggerCoinRain = () => {
    setCoinKey((k) => k + 1);
    setShowCoin(true);
    playCoinSound();
    setTimeout(() => setShowCoin(false), 2800);
  };

  const triggerWrongShake = () => {
    setWrongShake(true);
    setTimeout(() => setWrongShake(false), 600);
  };

  // 金额滚动动画
  useEffect(() => {
    const currentCash = store.state.cash;
    if (prevCashRef.current !== 0 && prevCashRef.current !== currentCash) {
      const from = prevCashRef.current;
      const to = currentCash;
      const duration = 400;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setAnimatedCash(Math.round(from + (to - from) * eased));
        if (progress < 1) requestAnimationFrame(step);
        else setAnimatedCash(null);
      };
      requestAnimationFrame(step);
    }
    prevCashRef.current = currentCash;
  }, [store.state.cash]);

  const isWinChoice = (effect: OptionEffect): boolean => {
    if ((effect.cash ?? 0) > 0) return true;
    if ((effect.exposure ?? 0) > 0) return true;
    if ((effect.enterConversion ?? 0) > 0) return true;
    if ((effect.orderConversion ?? 0) > 0) return true;
    if ((effect.avgPrice ?? 0) > 0) return true;
    if ((effect.badReviewRate ?? 0) < 0) return true;
    return false;
  };

  useEffect(() => {
    setHydrated(true);
    if (store.phase === "home" && store.dayQuestions.length === 0) {
      router.push("/");
    }
  }, []);

  useEffect(() => {
    if (store.phase === "result") router.push("/result");
  }, [store.phase, router]);

  useEffect(() => {
    if (store.phase === "day-intro") setShowIntro(true);
  }, [store.state.day, store.phase]);

  useEffect(() => {
    if (store.phase === "day-settle") {
      const summary = store.dailySummaries[store.dailySummaries.length - 1];
      if (summary) track("day_settle", { day: summary.day, profit: summary.profit });
    }
  }, [store.phase, store.dailySummaries.length]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-secondary text-lg">加载中...</div>
      </div>
    );
  }

  const question = store.currentQuestion();
  const s = store.state;
  const displayCash = animatedCash ?? s.cash;

  // ============================================================
  // 每日结算
  // ============================================================
  if (store.phase === "day-settle") {
    const summary = store.dailySummaries[store.dailySummaries.length - 1];
    if (!summary) return null;
    const isBankrupt = summary.cashAfter <= 0;
    const isLastDay = s.day >= GAME_CONFIG.maxDay;
    // 和前一天对比
    const prevSummary = store.dailySummaries.length >= 2
      ? store.dailySummaries[store.dailySummaries.length - 2]
      : null;

    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        {/* 大数字头部 */}
        <div className={`pt-8 pb-12 px-6 rounded-b-[2rem] ${
          summary.profit >= 0 ? "bg-brand" : "bg-gradient-to-b from-red-500 to-red-600"
        }`}>
          <p className={`text-center text-base ${summary.profit >= 0 ? "text-title/70" : "text-white/70"}`}>
            第{summary.day}天 结算
          </p>
          <div className={`text-center text-[52px] font-black leading-tight animate-number-pop ${
            summary.profit >= 0 ? "text-title" : "text-white"
          }`}>
            {summary.profit >= 0 ? "+" : ""}¥{summary.profit.toLocaleString()}
          </div>
          <p className={`text-center text-base mt-1 ${summary.profit >= 0 ? "text-title/60" : "text-white/60"}`}>
            今日净利润 · 余额 ¥{summary.cashAfter.toLocaleString()}
          </p>
        </div>

        <div className="flex-1 px-4 -mt-5 space-y-4 relative z-10 pb-4">
          {/* 一句话点评 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <p className="text-lg text-body leading-relaxed font-medium">{summary.comment}</p>
            </div>
          </div>

          {/* 指标对比卡片 — 用↑↓箭头显示变化 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-5 gap-1">
              <DeltaStat
                label="曝光"
                value={summary.exposureEnd}
                prev={prevSummary?.exposureEnd ?? GAME_CONFIG.initialExposure}
                format={(v) => String(v)}
              />
              <DeltaStat
                label="入店率"
                value={summary.enterConversionEnd}
                prev={prevSummary?.enterConversionEnd ?? GAME_CONFIG.initialEnterConversion}
                format={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <DeltaStat
                label="下单率"
                value={summary.orderConversionEnd}
                prev={prevSummary?.orderConversionEnd ?? GAME_CONFIG.initialOrderConversion}
                format={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <DeltaStat
                label="客单价"
                value={summary.avgPriceEnd}
                prev={prevSummary?.avgPriceEnd ?? GAME_CONFIG.initialAvgPrice}
                format={(v) => `¥${v}`}
              />
              <DeltaStat
                label="差评率"
                value={summary.badReviewEnd}
                prev={prevSummary?.badReviewEnd ?? GAME_CONFIG.initialBadReviewRate}
                format={(v) => `${(v * 100).toFixed(0)}%`}
                invertColor
              />
            </div>
          </div>

          {/* 展开详情 */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="bg-white rounded-xl px-4 py-3 shadow-sm text-base text-secondary font-bold text-center w-full"
          >
            {showDetail ? "收起详情 ↑" : "📊 查看账本详情 ↓"}
          </button>

          {showDetail && (
            <>
              {/* 账本 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-base font-bold text-title mb-3">📒 今日账本</p>
                <div className="space-y-2">
                  <Row label="期初现金" value={`¥${summary.cashBefore.toLocaleString()}`} />
                  <Row label="订单收入" value={`+¥${summary.incomeRevenue.toLocaleString()}`} positive />
                  <Row label={`固定成本`} value={`-¥${summary.fixedCost}`} negative />
                  <Row
                    label="经营决策"
                    value={`${summary.choiceImpact >= 0 ? "+" : ""}¥${summary.choiceImpact.toLocaleString()}`}
                    positive={summary.choiceImpact >= 0}
                    negative={summary.choiceImpact < 0}
                  />
                  <div className="border-t border-border pt-2 mt-2" />
                  <Row label="期末现金" value={`¥${summary.cashAfter.toLocaleString()}`} bold />
                </div>
              </div>

              {/* 营业额公式 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-base font-bold text-title mb-2">📊 营业额怎么来的</p>
                <div className="bg-neutral-50 rounded-xl p-3">
                  <p className="text-center text-base font-black text-title">
                    {summary.exposureEnd} × {(summary.enterConversionEnd * 100).toFixed(0)}% × {(summary.effectiveOrderConv * 100).toFixed(0)}% × ¥{summary.avgPriceEnd}
                  </p>
                  <p className="text-center text-sm text-secondary mt-1">
                    ≈ {summary.estimatedOrders}单 × ¥{summary.avgPriceEnd} = <span className="font-black text-title">¥{summary.incomeRevenue}</span>
                  </p>
                </div>
              </div>

              {/* 突发事件 */}
              {summary.eventTitle && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{summary.eventEmoji}</span>
                    <div>
                      <p className="text-lg font-black text-title">{summary.eventTitle}</p>
                      <p className="text-base text-secondary">{summary.eventDesc}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-neutral-100 via-neutral-100 to-transparent">
          <button
            onClick={() => {
              setShowDetail(false);
              track("next_day", { day: s.day });
              store.nextDay();
            }}
            className="btn-raised text-xl"
          >
            {isBankrupt
              ? "💀 查看结局"
              : isLastDay
              ? "🏆 查看5天战绩"
              : `进入第${s.day + 1}天 💰¥${summary.cashAfter.toLocaleString()}`}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 每日开场 intro — 全屏沉浸
  // ============================================================
  if (store.phase === "day-intro" && showIntro) {
    const story = DAY_STORIES.find((st) => st.day === s.day);
    const bgColors = [
      "from-amber-400 to-orange-400",    // day 1
      "from-blue-400 to-indigo-500",      // day 2
      "from-red-400 to-pink-500",         // day 3
      "from-emerald-400 to-teal-500",     // day 4
      "from-purple-500 to-rose-500",      // day 5
    ];
    const bgClass = bgColors[(s.day - 1) % bgColors.length];

    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex flex-col items-center justify-center px-6 relative overflow-hidden`}>
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white rounded-full" />
          <div className="absolute bottom-20 -left-16 w-40 h-40 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-sm w-full">
          {/* 天数进度 */}
          <div className="flex justify-center gap-1.5 mb-6">
            {Array.from({ length: GAME_CONFIG.maxDay }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < s.day - 1
                    ? "w-8 bg-white"
                    : i === s.day - 1
                    ? "w-12 bg-white"
                    : "w-8 bg-white/30"
                }`}
              />
            ))}
          </div>

          <div className="text-6xl mb-4 animate-bounce-in">{story?.emoji || "📋"}</div>
          <h2 className="text-4xl font-black text-white mb-1 drop-shadow-sm">
            {story?.title || `第 ${s.day} 天`}
          </h2>
          <p className="text-base text-white/60 mb-4">{story?.mood}</p>

          {story && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 mb-4 text-left border border-white/20">
              <p className="text-lg text-white leading-relaxed">{story.intro}</p>
            </div>
          )}

          {/* 突发事件 */}
          {store.dayEvent ? (
            <div className="bg-white rounded-2xl p-4 mb-4 animate-slide-up">
              <div className="flex items-center gap-2 justify-center mb-1">
                <span className="text-3xl">{store.dayEvent.emoji}</span>
                <span className="text-lg font-black text-title">{store.dayEvent.title}</span>
              </div>
              <p className="text-base text-secondary">{store.dayEvent.desc}</p>
            </div>
          ) : s.day > 1 ? (
            <p className="text-base text-white/50 mb-4">今天没有突发事件</p>
          ) : null}

          {/* 当前状态：只突出现金 */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20">
            <p className="text-4xl font-black text-white mb-1">💰 ¥{s.cash.toLocaleString()}</p>
            <div className="flex justify-center gap-3 text-sm text-white/70">
              <span>曝光 {s.exposure}</span>
              <span>·</span>
              <span>入店 {(s.enterConversion * 100).toFixed(0)}%</span>
              <span>·</span>
              <span>下单 {(s.orderConversion * 100).toFixed(0)}%</span>
            </div>
          </div>

          <button
            onClick={() => {
              setShowIntro(false);
              useGameStore.setState({ phase: "playing" });
            }}
            className="btn-raised text-xl"
          >
            开始今天的经营
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 答题中
  // ============================================================
  if (!question) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-secondary text-lg">加载中...</div>
      </div>
    );
  }

  const progress = ((s.day - 1) * GAME_CONFIG.questionsPerDay + store.dayQuestionIndex) / (GAME_CONFIG.maxDay * GAME_CONFIG.questionsPerDay) * 100;

  return (
    <div className={`min-h-screen bg-neutral-100 flex flex-col pb-6 ${wrongShake ? "animate-shake" : ""}`}>
      {/* ===== 顶部状态栏 ===== */}
      <div className="bg-brand px-4 pt-4 pb-4 rounded-b-[1.5rem]">
        {/* 第一行：天数 + 题号 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-black text-title">
            第{s.day}天
          </span>
          <span className="text-base text-title/70 font-bold">
            {store.dayQuestionIndex + 1} / {store.dayQuestions.length}
          </span>
        </div>

        {/* 第二行：现金（大）+ 迷你指标条 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-shrink-0">
            <span className={`text-3xl font-black text-title transition-colors ${
              displayCash <= 3000 ? "!text-red-700" : ""
            }`}>
              💰¥{displayCash.toLocaleString()}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-4 gap-1">
            <MiniBar label="曝光" value={s.exposure} max={5000} color="bg-blue-500" />
            <MiniBar label="入店" value={s.enterConversion} max={0.3} color="bg-emerald-500" isPercent />
            <MiniBar label="下单" value={s.orderConversion} max={0.4} color="bg-purple-500" isPercent />
            <MiniBar label="差评" value={s.badReviewRate} max={0.2} color="bg-red-500" isPercent invert />
          </div>
        </div>

        {/* 进度条 */}
        <div className="bg-black/10 rounded-full h-1.5">
          <div
            className="bg-title h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ===== 题目区 ===== */}
      <div className="flex-1 px-4 pt-4 space-y-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-black text-title mb-2">{question.title}</h2>
          <p className="text-lg text-secondary leading-relaxed">{question.desc}</p>
        </div>

        {/* === 选完后的反馈区 === */}
        {pending ? (
          <div className="space-y-3 animate-knowledge-in">
            {/* 你的选择 + verdict角标 + 效果标签 */}
            <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${
              pending.verdict?.startsWith("推荐")
                ? "border-green-300"
                : "border-orange-300"
            }`}>
              {/* verdict 角标 */}
              {pending.verdict && (
                <div className={`inline-block text-sm font-black px-2.5 py-1 rounded-lg mb-2 ${
                  pending.verdict.startsWith("推荐")
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {pending.verdict.startsWith("推荐") ? "✅ " : "⚠️ "}{pending.verdict}
                </div>
              )}

              <p className="text-lg font-black text-title mb-3">{pending.optionText}</p>

              {/* 效果标签 */}
              <div className="flex flex-wrap gap-2">
                {effectChips(pending.effect).map((chip, ci) => (
                  <span
                    key={ci}
                    className={`text-base px-3 py-1.5 rounded-xl font-black ${chip.cls}`}
                  >
                    {chip.text}
                  </span>
                ))}
                {effectChips(pending.effect).length === 0 && (
                  <span className="text-base text-secondary">无明显变化</span>
                )}
              </div>
            </div>

            {/* 知识点 — 默认折叠，只显示一行摘要 */}
            <button
              onClick={() => setShowKnowledge(!showKnowledge)}
              className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-brand/40 rounded-2xl p-4 shadow-sm w-full text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl flex-shrink-0">💡</span>
                <span className="text-base font-black text-brand-dark flex-1">
                  {showKnowledge ? "收起知识点" : "为什么？点击查看知识点"}
                </span>
                <span className="text-base text-brand-dark">{showKnowledge ? "↑" : "↓"}</span>
              </div>
              {showKnowledge && (
                <div className="mt-3 pt-3 border-t border-brand/20">
                  <p className="text-lg text-body leading-relaxed">{pending.knowledge}</p>
                  {pending.realCase && (
                    <p className="text-base text-blue-700 leading-relaxed mt-3 bg-blue-50 rounded-xl p-3">
                      📋 {pending.realCase}
                    </p>
                  )}
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setPending(null);
                setShowKnowledge(false);
                store.nextQuestion();
              }}
              className="btn-raised text-xl mt-2"
            >
              {store.dayQuestionIndex + 1 >= store.dayQuestions.length ? "📊 进入今日结算" : "继续下一题 →"}
            </button>
          </div>
        ) : (
          /* === 选项区 === */
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  store.submitChoice(idx);
                  const win = isWinChoice(opt.effect);
                  setPending({
                    optionIndex: idx,
                    optionText: opt.text,
                    effect: opt.effect,
                    knowledge: opt.knowledge ?? "",
                    verdict: opt.verdict,
                    realCase: question.realCase,
                  });
                  track("answer_choice", { qid: question.id, opt: idx });
                  if (win) {
                    triggerCoinRain();
                  } else {
                    triggerWrongShake();
                  }
                }}
                className="btn-raised-card"
              >
                <p className="text-lg font-bold text-title leading-snug">{opt.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 金币雨 / 红色闪屏 */}
      {showCoin && <CoinRain key={coinKey} />}
      {wrongShake && <div className="wrong-vignette" />}
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

function effectChips(effect: OptionEffect): { text: string; cls: string }[] {
  const chips: { text: string; cls: string }[] = [];
  const positive = "bg-green-100 text-green-700";
  const negative = "bg-red-100 text-red-600";

  if (effect.cash !== undefined && effect.cash !== 0) {
    chips.push({
      text: `现金 ${effect.cash > 0 ? "+" : ""}¥${effect.cash}`,
      cls: effect.cash > 0 ? positive : negative,
    });
  }
  if (effect.exposure !== undefined && effect.exposure !== 0) {
    chips.push({
      text: `曝光 ${effect.exposure > 0 ? "+" : ""}${effect.exposure}`,
      cls: effect.exposure > 0 ? positive : negative,
    });
  }
  if (effect.enterConversion !== undefined && effect.enterConversion !== 0) {
    chips.push({
      text: `入店 ${effect.enterConversion > 0 ? "+" : ""}${(effect.enterConversion * 100).toFixed(1)}%`,
      cls: effect.enterConversion > 0 ? positive : negative,
    });
  }
  if (effect.orderConversion !== undefined && effect.orderConversion !== 0) {
    chips.push({
      text: `下单 ${effect.orderConversion > 0 ? "+" : ""}${(effect.orderConversion * 100).toFixed(1)}%`,
      cls: effect.orderConversion > 0 ? positive : negative,
    });
  }
  if (effect.avgPrice !== undefined && effect.avgPrice !== 0) {
    chips.push({
      text: `客单 ${effect.avgPrice > 0 ? "+" : ""}¥${effect.avgPrice}`,
      cls: effect.avgPrice > 0 ? positive : negative,
    });
  }
  if (effect.badReviewRate !== undefined && effect.badReviewRate !== 0) {
    chips.push({
      text: `差评 ${effect.badReviewRate > 0 ? "+" : ""}${(effect.badReviewRate * 100).toFixed(1)}%`,
      cls: effect.badReviewRate < 0 ? positive : negative,
    });
  }
  return chips;
}

/** 迷你进度条指标 */
function MiniBar({
  label,
  value,
  max,
  color,
  isPercent,
  invert,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  isPercent?: boolean;
  invert?: boolean;
}) {
  const ratio = Math.min(value / max, 1);
  const displayVal = isPercent ? `${(value * 100).toFixed(0)}%` : String(value);
  return (
    <div>
      <div className="text-[11px] text-title/60 text-center mb-0.5">{label}</div>
      <div className="bg-black/10 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${invert ? (ratio > 0.5 ? "bg-red-500" : "bg-emerald-500") : color}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="text-xs text-title font-bold text-center mt-0.5">{displayVal}</div>
    </div>
  );
}

/** 结算页对比指标 */
function DeltaStat({
  label,
  value,
  prev,
  format,
  invertColor,
}: {
  label: string;
  value: number;
  prev: number;
  format: (v: number) => string;
  invertColor?: boolean;
}) {
  const delta = value - prev;
  const isUp = delta > 0.0001;
  const isDown = delta < -0.0001;
  // 差评率涨是坏事，要反色
  const isGood = invertColor ? isDown : isUp;
  const isBad = invertColor ? isUp : isDown;

  return (
    <div className="text-center">
      <div className="text-xs text-secondary mb-0.5">{label}</div>
      <div className="text-sm font-black text-title">{format(value)}</div>
      {(isUp || isDown) && (
        <div className={`text-xs font-black ${isGood ? "text-green-600" : isBad ? "text-red-500" : "text-secondary"}`}>
          {isUp ? "↑" : "↓"}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  negative,
  bold,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${bold ? "text-base font-bold" : "text-base"} text-secondary`}>{label}</span>
      <span
        className={`${bold ? "text-xl font-black" : "text-lg font-bold"} ${
          positive ? "text-green-600" : negative ? "text-red-500" : "text-title"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
