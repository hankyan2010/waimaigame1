"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG } from "@/lib/config";
import type { OptionEffect } from "@/lib/types";

interface PendingAnswer {
  optionIndex: number;
  optionText: string;
  effect: OptionEffect;
  knowledge: string;
}

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [pending, setPending] = useState<PendingAnswer | null>(null);

  useEffect(() => {
    setHydrated(true);
    if (store.phase === "home" || store.dayQuestions.length === 0) {
      store.startNewGame();
      track("start_game");
    }
  }, []);

  useEffect(() => {
    if (store.phase === "result") {
      router.push("/result");
    }
  }, [store.phase, router]);

  useEffect(() => {
    if (store.phase === "day-intro") setShowIntro(true);
  }, [store.state.day, store.phase]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-secondary">加载中...</div>
      </div>
    );
  }

  const question = store.currentQuestion();
  const s = store.state;

  // === 每日结算页面 ===
  if (store.phase === "day-settle") {
    const summary = store.dailySummaries[store.dailySummaries.length - 1];
    if (!summary) return null;
    const isBankrupt = summary.cashAfter <= 0;
    const isLastDay = s.day >= GAME_CONFIG.maxDay;

    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="bg-brand pt-6 pb-10 px-6 rounded-b-[2rem]">
          <p className="text-center text-sm text-title/70">Day {summary.day} 结算</p>
          <div className={`text-center text-[44px] font-black leading-tight ${
            summary.profit >= 0 ? "text-title" : "text-red-700"
          }`}>
            {summary.profit >= 0 ? "+" : ""}¥{summary.profit}
          </div>
          <p className="text-center text-xs text-title/60">今日净利润</p>
        </div>

        <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10 pb-4">
          {/* 营业额公式分解 */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-title mb-2">📊 营业额是怎么算出来的</p>
            <div className="bg-bg/40 rounded-xl p-3 mb-2">
              <div className="text-[11px] text-secondary text-center mb-1">
                曝光量 × 有效转化率 × 客单价
              </div>
              <div className="text-center text-sm font-black text-title">
                {summary.exposureEnd} × {(summary.effectiveConversion * 100).toFixed(1)}% × ¥{summary.avgPriceEnd}
              </div>
              <div className="text-center text-[11px] text-secondary mt-1">
                ≈ {summary.estimatedOrders} 单 × ¥{summary.avgPriceEnd} = <span className="font-bold text-title">¥{summary.incomeRevenue}</span>
              </div>
            </div>
            <p className="text-[10px] text-secondary leading-relaxed">
              注：差评率会按 50% 折扣有效转化率 — 当前差评 {(summary.badReviewEnd * 100).toFixed(1)}%
            </p>
          </div>

          {/* 账本 */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-title mb-2">📒 今日账本</p>
            <div className="space-y-1.5">
              <Row label="期初现金" value={`¥${summary.cashBefore}`} />
              <Row label="订单收入" value={`+¥${summary.incomeRevenue}`} positive />
              <Row label={`固定成本（租金${GAME_CONFIG.dailyRent}+员工${GAME_CONFIG.dailyStaff}）`} value={`-¥${summary.fixedCost}`} negative />
              <Row
                label="经营决策投入"
                value={`${summary.choiceImpact >= 0 ? "+" : ""}¥${summary.choiceImpact}`}
                positive={summary.choiceImpact >= 0}
                negative={summary.choiceImpact < 0}
              />
              <div className="border-t border-border pt-1.5 mt-1.5" />
              <Row label="期末现金" value={`¥${summary.cashAfter}`} bold />
              <Row
                label="今日净利润"
                value={`${summary.profit >= 0 ? "+" : ""}¥${summary.profit}`}
                bold
                positive={summary.profit >= 0}
                negative={summary.profit < 0}
              />
            </div>
          </div>

          {/* 关键指标 */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-title mb-2">📈 期末关键指标</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <Stat label="曝光" value={summary.exposureEnd} />
              <Stat label="转化率" value={`${(summary.conversionEnd * 100).toFixed(1)}%`} />
              <Stat label="客单价" value={`¥${summary.avgPriceEnd}`} />
              <Stat label="差评率" value={`${(summary.badReviewEnd * 100).toFixed(1)}%`} />
            </div>
          </div>

          {/* 当日决策回顾 */}
          {summary.choiceLog.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-title mb-2">🎯 今日决策影响</p>
              <div className="space-y-2">
                {summary.choiceLog.map((log, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-2 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-secondary truncate">{log.questionTitle}</p>
                        <p className="text-xs font-bold text-title leading-snug">{log.optionText}</p>
                      </div>
                      {log.cashDelta !== 0 && (
                        <span className={`text-xs font-black flex-shrink-0 ${
                          log.cashDelta > 0 ? "text-green-600" : "text-red-500"
                        }`}>
                          {log.cashDelta > 0 ? "+" : ""}¥{log.cashDelta}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {effectChips(log.effects).map((chip, ci) => (
                        <span
                          key={ci}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${chip.cls}`}
                        >
                          {chip.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 事件回顾 */}
          {summary.eventTitle && (
            <div className="bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-title mb-2">⚡ 今日突发事件</p>
              <div className="flex items-start gap-2">
                <span className="text-2xl">{summary.eventEmoji}</span>
                <div>
                  <p className="text-sm font-bold text-title">{summary.eventTitle}</p>
                  <p className="text-[11px] text-secondary">{summary.eventDesc}</p>
                </div>
              </div>
            </div>
          )}

          {/* 自动点评 */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-body leading-relaxed">{summary.comment}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
          <button
            onClick={() => store.nextDay()}
            className="btn-raised text-base"
          >
            {isBankrupt
              ? "查看结局"
              : isLastDay
              ? "查看7天战绩"
              : `进入 Day ${s.day + 1}`}
          </button>
        </div>
      </div>
    );
  }

  // === 每日开场 intro ===
  if (store.phase === "day-intro" && showIntro) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <p className="text-sm text-secondary mb-2">Day {s.day} / {GAME_CONFIG.maxDay}</p>
          <h2 className="text-3xl font-black text-title mb-3">
            {s.day === 1 ? "开业第一天" : s.day === GAME_CONFIG.maxDay ? "最后一天冲刺" : `第 ${s.day} 天`}
          </h2>

          {store.dayEvent ? (
            <div className="bg-card rounded-2xl p-4 shadow-sm mb-4">
              <div className="text-3xl mb-2">{store.dayEvent.emoji}</div>
              <p className="text-sm font-bold text-title mb-1">{store.dayEvent.title}</p>
              <p className="text-xs text-secondary">{store.dayEvent.desc}</p>
            </div>
          ) : (
            <p className="text-sm text-secondary mb-4">
              今天没有特殊事件，看你的决策
            </p>
          )}

          <div className="bg-card rounded-2xl p-3 shadow-sm mb-6">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Stat label="现金" value={`¥${s.cash}`} />
              <Stat label="曝光" value={s.exposure} />
              <Stat label="转化" value={`${(s.conversion * 100).toFixed(0)}%`} />
              <Stat label="差评" value={`${(s.badReviewRate * 100).toFixed(0)}%`} />
            </div>
          </div>

          <button
            onClick={() => {
              setShowIntro(false);
              useGameStore.setState({ phase: "playing" });
            }}
            className="btn-raised text-base"
          >
            开始今天的经营
          </button>
        </div>
      </div>
    );
  }

  // === 答题中 ===
  if (!question) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-secondary">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-6">
      {/* Top bar */}
      <div className="bg-brand px-4 pt-4 pb-5 rounded-b-[1.5rem]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-title">
            Day {s.day} / {GAME_CONFIG.maxDay}
          </span>
          <span className="text-xs text-title/70">
            题目 {store.dayQuestionIndex + 1} / {store.dayQuestions.length}
          </span>
        </div>

        {/* Status strip */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <MiniStat label="现金" value={`¥${s.cash}`} />
          <MiniStat label="曝光" value={s.exposure.toString()} />
          <MiniStat label="转化" value={`${(s.conversion * 100).toFixed(0)}%`} />
          <MiniStat label="差评" value={`${(s.badReviewRate * 100).toFixed(0)}%`} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 pt-4 space-y-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-black text-title mb-1">{question.title}</h2>
          <p className="text-sm text-secondary leading-relaxed">{question.desc}</p>
        </div>

        {pending ? (
          <div className="space-y-3 animate-knowledge-in">
            {/* 你的选择 */}
            <div className="bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] text-secondary mb-1">你的选择</p>
              <p className="text-sm font-black text-title mb-3">{pending.optionText}</p>
              <div className="flex flex-wrap gap-1.5">
                {effectChips(pending.effect).map((chip, ci) => (
                  <span
                    key={ci}
                    className={`text-[11px] px-2 py-1 rounded-lg font-bold ${chip.cls}`}
                  >
                    {chip.text}
                  </span>
                ))}
                {effectChips(pending.effect).length === 0 && (
                  <span className="text-[11px] text-secondary">无明显变化</span>
                )}
              </div>
            </div>

            {/* 知识点 */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-brand/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="text-xl flex-shrink-0">💡</span>
                <div>
                  <p className="text-[11px] font-bold text-brand-dark mb-1">为什么会这样涨/跌？</p>
                  <p className="text-sm text-body leading-relaxed">{pending.knowledge}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPending(null);
                store.nextQuestion();
              }}
              className="btn-raised text-base mt-2"
            >
              {store.dayQuestionIndex + 1 >= store.dayQuestions.length ? "进入今日结算" : "继续下一题"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  store.submitChoice(idx);
                  setPending({
                    optionIndex: idx,
                    optionText: opt.text,
                    effect: opt.effect,
                    knowledge: opt.knowledge ?? "",
                  });
                  track("answer_choice", { qid: question.id, opt: idx });
                }}
                className="btn-raised-card"
              >
                <p className="text-sm font-bold text-title leading-snug">{opt.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-secondary/40 pt-4">v3.1.0-knowledge</p>
    </div>
  );
}

// 把 OptionEffect 转换成可视化的标签
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
  if (effect.conversion !== undefined && effect.conversion !== 0) {
    chips.push({
      text: `转化 ${effect.conversion > 0 ? "+" : ""}${(effect.conversion * 100).toFixed(1)}%`,
      cls: effect.conversion > 0 ? positive : negative,
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
      cls: effect.badReviewRate < 0 ? positive : negative, // 差评↓是好的
    });
  }
  return chips;
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
      <span className="text-xs text-secondary">{label}</span>
      <span
        className={`${bold ? "text-base font-black" : "text-sm font-bold"} ${
          positive ? "text-green-600" : negative ? "text-red-500" : "text-title"
        }`}
      >
        {value}
      </span>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/10 rounded-lg py-1">
      <div className="text-[11px] font-bold text-title">{value}</div>
      <div className="text-[9px] text-title/60">{label}</div>
    </div>
  );
}
