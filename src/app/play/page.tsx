"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { track } from "@/lib/track";
import { GAME_CONFIG } from "@/lib/config";

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [lastEffect, setLastEffect] = useState<string | null>(null);

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
          <div className="text-center text-[44px] font-black text-title leading-tight">
            {summary.profit >= 0 ? "+" : ""}¥{summary.profit}
          </div>
          <p className="text-center text-xs text-title/60">今日利润</p>
        </div>

        <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10">
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="space-y-2">
              <Row label="订单收入" value={`+¥${summary.incomeRevenue}`} positive />
              <Row label="固定成本（租金+员工）" value={`-¥${summary.fixedCost}`} />
              <Row
                label="经营决策影响"
                value={`${summary.choiceImpact >= 0 ? "+" : ""}¥${summary.choiceImpact}`}
                positive={summary.choiceImpact >= 0}
              />
              <div className="border-t border-border pt-2 mt-2" />
              <Row label="当前现金" value={`¥${summary.cashAfter}`} bold />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="曝光" value={summary.exposureEnd} />
              <Stat label="转化率" value={`${(summary.conversionEnd * 100).toFixed(1)}%`} />
              <Stat label="差评率" value={`${(summary.badReviewEnd * 100).toFixed(1)}%`} />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-body leading-relaxed">{summary.comment}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
          <button
            onClick={() => {
              if (isBankrupt || isLastDay) {
                store.nextDay();
              } else {
                store.nextDay();
              }
            }}
            className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
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
      <div
        className="min-h-screen bg-bg flex items-center justify-center px-6"
        onClick={() => {
          setShowIntro(false);
          useGameStore.setState({ phase: "playing" });
        }}
      >
        <div className="text-center max-w-sm">
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

          <p className="text-xs text-secondary animate-pulse">点击屏幕继续</p>
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
    <div className="min-h-screen bg-bg flex flex-col">
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

        {lastEffect ? (
          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-3 text-center">
            <p className="text-sm text-title">{lastEffect}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  store.submitChoice(idx);
                  const effects: string[] = [];
                  if (opt.effect.cash) effects.push(`现金 ${opt.effect.cash > 0 ? "+" : ""}¥${opt.effect.cash}`);
                  if (opt.effect.exposure) effects.push(`曝光 ${opt.effect.exposure > 0 ? "+" : ""}${opt.effect.exposure}`);
                  if (opt.effect.conversion)
                    effects.push(`转化 ${opt.effect.conversion > 0 ? "+" : ""}${(opt.effect.conversion * 100).toFixed(1)}%`);
                  if (opt.effect.avgPrice) effects.push(`客单 ${opt.effect.avgPrice > 0 ? "+" : ""}¥${opt.effect.avgPrice}`);
                  if (opt.effect.badReviewRate)
                    effects.push(`差评 ${opt.effect.badReviewRate > 0 ? "+" : ""}${(opt.effect.badReviewRate * 100).toFixed(1)}%`);
                  setLastEffect(effects.join(" · ") || "无明显变化");
                  setTimeout(() => {
                    setLastEffect(null);
                    store.nextQuestion();
                  }, 1400);
                }}
                className="w-full bg-card rounded-2xl p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
              >
                <p className="text-sm font-bold text-title">{opt.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-secondary/40 pb-2 pt-4">v3.0.0-sim</p>
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  bold,
}: {
  label: string;
  value: string;
  positive?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-secondary">{label}</span>
      <span
        className={`text-sm ${bold ? "font-black" : "font-bold"} ${
          positive ? "text-title" : "text-title"
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
