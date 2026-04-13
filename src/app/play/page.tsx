"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG, DAY_STORIES } from "@/lib/config";
import type { OptionEffect } from "@/lib/types";
import { CoinRain } from "@/components/CoinRain";
import { playCoinSound } from "@/lib/sound";
import { BrandBar } from "@/components/BrandBar";

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
  const [weekendShareOverlay, setWeekendShareOverlay] = useState(false);
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
    const actualMaxDay = store.weekendUnlocked ? 7 : GAME_CONFIG.maxDay;
    const isLastDay = s.day >= actualMaxDay;
    // 和前一天对比
    const prevSummary = store.dailySummaries.length >= 2
      ? store.dailySummaries[store.dailySummaries.length - 2]
      : null;

    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        {/* 品牌栏 */}
        <div className="px-4 pt-4"><BrandBar /></div>
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
          <p className={`text-center text-sm mt-1 ${summary.profit >= 0 ? "text-title/60" : "text-white/60"}`}>
            💡 {summary.comment}
          </p>
        </div>

        <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10 pb-4">

          {/* 账本 — 紧凑但完整 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* 营业额公式 */}
            <div className="bg-neutral-50 rounded-xl p-2 mb-3">
              <p className="text-xs text-secondary text-center mb-0.5">今日营业额</p>
              <p className="text-sm font-black text-title text-center">
                {summary.exposureEnd}曝光 × {(summary.enterConversionEnd * 100).toFixed(0)}%入店 × {(summary.effectiveOrderConv * 100).toFixed(0)}%下单 × ¥{summary.avgPriceEnd}
              </p>
              <p className="text-sm text-center text-secondary">
                = {summary.estimatedOrders}单 × ¥{summary.avgPriceEnd} = <span className="font-black text-green-600">¥{summary.incomeRevenue}</span>
              </p>
            </div>
            {/* 收支明细 */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">订单收入</span>
                <span className="font-black text-green-600">+¥{summary.incomeRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">固定成本（租金+员工）</span>
                <span className="font-black text-red-500">-¥{summary.fixedCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">经营决策</span>
                <span className={`font-black ${summary.choiceImpact >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {summary.choiceImpact >= 0 ? "+" : ""}¥{summary.choiceImpact}
                </span>
              </div>
              <div className="border-t border-border pt-1 mt-1 flex justify-between">
                <span className="font-bold text-title">期末余额</span>
                <span className="text-lg font-black text-title">¥{summary.cashAfter.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 突发事件 */}
          {summary.eventTitle && (
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{summary.eventEmoji}</span>
                <div>
                  <p className="text-base font-black text-title">{summary.eventTitle}</p>
                  <p className="text-sm text-secondary">{summary.eventDesc}</p>
                </div>
              </div>
            </div>
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
              ? `🏆 查看${actualMaxDay}天战绩`
              : `进入第${s.day + 1}天 💰¥${summary.cashAfter.toLocaleString()}`}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 周末加赛解锁门
  // ============================================================
  if (store.phase === "weekend-gate") {
    const profit = s.cash - GAME_CONFIG.initialCash;
    // weekendShareStep: 0=初始, 1=已点分享按钮显示蒙版
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-rose-500 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white rounded-full" />
          <div className="absolute bottom-20 -left-16 w-40 h-40 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-sm w-full">
          <div className="text-6xl mb-4 animate-bounce-in">🏆</div>
          <h2 className="text-3xl font-black text-white mb-2">5天经营结束！</h2>
          <div className="text-4xl font-black text-white mb-1">
            💰 {profit >= 0 ? "+" : ""}¥{profit.toLocaleString()}
          </div>
          <p className="text-lg text-white/70 mb-6">余额 ¥{s.cash.toLocaleString()}</p>

          <div className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <p className="text-2xl font-black text-title mb-2">🔥 周末加赛</p>
            <p className="text-lg text-body leading-relaxed mb-4">
              分享给朋友，解锁<span className="font-black text-red-500">周六+周日</span>两天加赛！
              <br />周末客流量翻倍，冲击更高利润+打榜！
            </p>

            <button
              onClick={() => setWeekendShareOverlay(true)}
              className="btn-raised text-xl mb-3"
            >
              📢 分享解锁周末加赛
            </button>

            <button
              onClick={() => store.nextDay()}
              className="text-base text-secondary/50 text-center w-full py-2"
            >
              算了，直接看结果
            </button>
          </div>
        </div>

        {/* ===== 分享引导蒙版 ——必须点空白关闭后才能继续 ===== */}
        {weekendShareOverlay && (
          <div
            className="fixed inset-0 bg-black/85 z-[100] flex flex-col"
            onClick={() => {
              setWeekendShareOverlay(false);
              // 关闭蒙版 → 解锁周末 → 进入第6天
              store.unlockWeekend();
              track("weekend_unlock");
            }}
          >
            {/* 上方：大箭头指向右上角 */}
            <div className="flex justify-end p-6 pt-3">
              <div className="text-right">
                <div className="text-7xl animate-bounce">👆</div>
              </div>
            </div>

            {/* 中间：引导文案 */}
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="bg-white rounded-3xl p-8 max-w-[320px] text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-2xl font-black text-title mb-3">📢 先转发，再开始加赛</p>
                <div className="bg-brand/10 rounded-2xl p-4 mb-4">
                  <p className="text-xl font-black text-title mb-1">👆 点右上角「...」</p>
                  <p className="text-lg text-body">选择「转发给朋友」<br/>或「分享到朋友圈」</p>
                </div>
                <p className="text-base text-secondary mb-4">转发后，点击空白处开始周末加赛</p>
                <div className="border-t border-border pt-3">
                  <p className="text-sm text-secondary/60">👇 点击空白处关闭并开始第6天</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
      "from-orange-500 to-red-500",       // day 6 周末
      "from-yellow-400 to-amber-500",     // day 7 周末
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
          <div className="mb-4"><BrandBar /></div>
          {/* 天数进度 */}
          <div className="flex justify-center gap-1.5 mb-6">
            {Array.from({ length: store.weekendUnlocked ? 7 : GAME_CONFIG.maxDay }, (_, i) => (
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

          {story && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-3 text-left border border-white/20">
              <p className="text-base text-white leading-relaxed">{story.intro}</p>
            </div>
          )}

          {/* 突发事件 */}
          {store.dayEvent && (
            <div className="bg-white rounded-2xl p-3 mb-3 animate-slide-up">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-2xl">{store.dayEvent.emoji}</span>
                <span className="text-base font-black text-title">{store.dayEvent.title}</span>
              </div>
              <p className="text-sm text-secondary text-center">{store.dayEvent.desc}</p>
            </div>
          )}

          {/* 现金 */}
          <p className="text-3xl font-black text-white text-center mb-4">💰 ¥{s.cash.toLocaleString()}</p>

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

  const progress = ((s.day - 1) * GAME_CONFIG.questionsPerDay + store.dayQuestionIndex) / ((store.weekendUnlocked ? 7 : GAME_CONFIG.maxDay) * GAME_CONFIG.questionsPerDay) * 100;

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

            {/* 知识点 — 直接展示不折叠 */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-brand/40 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="text-xl flex-shrink-0">💡</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-body leading-snug">{pending.knowledge}</p>
                  {pending.realCase && (
                    <p className="text-sm text-blue-700 leading-snug mt-2 bg-blue-50 rounded-lg p-2">
                      📋 {pending.realCase}
                    </p>
                  )}
                </div>
              </div>
            </div>

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
