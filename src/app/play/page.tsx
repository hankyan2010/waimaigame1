"use client";

import { useEffect, useState } from "react";
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
  const [coinKey, setCoinKey] = useState(0);
  const [showCoin, setShowCoin] = useState(false);

  // 触发"疯狂掉金币"效果 + 音效
  const triggerCoinRain = () => {
    setCoinKey((k) => k + 1);
    setShowCoin(true);
    playCoinSound();
    // 2.8s 后清理 DOM（动画最长 2.4s + 延迟 0.4s 冗余）
    setTimeout(() => setShowCoin(false), 2800);
  };

  // 判定一个选项是不是"答对" - 凡是任意维度有正向经营改善都算
  // (之前只判 cash > 0 太严格，很多好选项是花钱换流量/口碑而不是直接进账)
  const isWinChoice = (effect: OptionEffect): boolean => {
    if ((effect.cash ?? 0) > 0) return true;
    if ((effect.exposure ?? 0) > 0) return true;
    if ((effect.enterConversion ?? 0) > 0) return true;
    if ((effect.orderConversion ?? 0) > 0) return true;
    if ((effect.avgPrice ?? 0) > 0) return true;
    if ((effect.badReviewRate ?? 0) < 0) return true; // 差评下降是好的
    return false;
  };

  useEffect(() => {
    setHydrated(true);
    // 正常流程：首页已经调过 startNewGame()，这里不需要再调
    // 只有直接访问 /play（没有游戏数据）时才兜底跳回首页
    if (store.phase === "home" && store.dayQuestions.length === 0) {
      router.push("/");
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

  // 每日结算埋点
  useEffect(() => {
    if (store.phase === "day-settle") {
      const summary = store.dailySummaries[store.dailySummaries.length - 1];
      if (summary) {
        track("day_settle", { day: summary.day, profit: summary.profit });
      }
    }
  }, [store.phase, store.dailySummaries.length]);

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
          <p className="text-center text-sm text-title/70">第{summary.day}天 结算</p>
          <div className={`text-center text-[44px] font-black leading-tight ${
            summary.profit >= 0 ? "text-title" : "text-red-700"
          }`}>
            {summary.profit >= 0 ? "+" : ""}¥{summary.profit}
          </div>
          <p className="text-center text-xs text-title/60">今日净利润</p>
        </div>

        <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10 pb-4">
          {/* 自动点评（始终显示） */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-body leading-relaxed">{summary.comment}</p>
            </div>
          </div>

          {/* 关键指标（始终显示） */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-5 gap-2 text-center">
              <Stat label="曝光" value={summary.exposureEnd} />
              <Stat label="入店率" value={`${(summary.enterConversionEnd * 100).toFixed(1)}%`} />
              <Stat label="下单率" value={`${(summary.orderConversionEnd * 100).toFixed(1)}%`} />
              <Stat label="客单价" value={`¥${summary.avgPriceEnd}`} />
              <Stat label="差评率" value={`${(summary.badReviewEnd * 100).toFixed(1)}%`} />
            </div>
          </div>

          {/* 查看详情按钮 */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="text-xs text-secondary underline text-center w-full py-1"
          >
            {showDetail ? "收起详情 ↑" : "查看营业额计算详情 ↓"}
          </button>

          {/* 折叠区域 */}
          {showDetail && (
            <>
              {/* 营业额公式分解 */}
              <div className="bg-card rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-title mb-2">📊 营业额是怎么算出来的</p>
                <div className="bg-bg/40 rounded-xl p-3 mb-2">
                  <div className="text-[11px] text-secondary text-center mb-1">
                    曝光 × 入店率 × 下单率 × 客单价
                  </div>
                  <div className="text-center text-sm font-black text-title">
                    {summary.exposureEnd} × {(summary.enterConversionEnd * 100).toFixed(1)}% × {(summary.effectiveOrderConv * 100).toFixed(1)}% × ¥{summary.avgPriceEnd}
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
            </>
          )}
        </div>

        <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
          <button
            onClick={() => {
              track("next_day", { day: s.day });
              store.nextDay();
            }}
            className="btn-raised text-base"
          >
            {isBankrupt
              ? "查看结局"
              : isLastDay
              ? "查看5天战绩"
              : `进入第${s.day + 1}天`}
          </button>
        </div>
      </div>
    );
  }

  // === 每日开场 intro ===
  if (store.phase === "day-intro" && showIntro) {
    const story = DAY_STORIES.find((st) => st.day === s.day);
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <p className="text-xs text-secondary mb-1">
            第{s.day}天 / 共{GAME_CONFIG.maxDay}天 · 进度 {Math.round((s.day - 1) / GAME_CONFIG.maxDay * 100)}%
          </p>
          <div className="text-4xl mb-2">{story?.emoji || "📋"}</div>
          <h2 className="text-2xl font-black text-title mb-2">
            {story?.title || `第 ${s.day} 天`}
          </h2>

          {story && (
            <div className="bg-card rounded-2xl p-4 shadow-sm mb-3 text-left">
              <p className="text-sm text-body leading-relaxed">{story.intro}</p>
              <p className="text-[10px] text-secondary mt-2 text-right">—— {story.mood}</p>
            </div>
          )}

          {store.dayEvent ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xl">{store.dayEvent.emoji}</span>
                <span className="text-sm font-bold text-title">{store.dayEvent.title}</span>
              </div>
              <p className="text-xs text-secondary mt-1">{store.dayEvent.desc}</p>
            </div>
          ) : s.day > 1 ? (
            <p className="text-xs text-secondary mb-2">今天没有突发事件</p>
          ) : null}

          <div className="bg-card rounded-2xl p-3 shadow-sm mb-5">
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <Stat label="现金" value={`¥${s.cash}`} />
              <Stat label="曝光" value={s.exposure} />
              <Stat label="入店" value={`${(s.enterConversion * 100).toFixed(0)}%`} />
              <Stat label="下单" value={`${(s.orderConversion * 100).toFixed(0)}%`} />
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
            第{s.day}天 / 共{GAME_CONFIG.maxDay}天
          </span>
          <span className="text-xs text-title/70">
            题目 {store.dayQuestionIndex + 1} / {store.dayQuestions.length}
          </span>
        </div>

        {/* Status strip */}
        <div className="grid grid-cols-5 gap-1 text-center">
          <MiniStat label="现金" value={`¥${s.cash}`} />
          <MiniStat label="曝光" value={s.exposure.toString()} />
          <MiniStat label="入店" value={`${(s.enterConversion * 100).toFixed(0)}%`} />
          <MiniStat label="下单" value={`${(s.orderConversion * 100).toFixed(0)}%`} />
          <MiniStat label="差评" value={`${(s.badReviewRate * 100).toFixed(0)}%`} />
        </div>

        {/* 总进度条 */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] text-title/60">进度</span>
          <div className="flex-1 bg-black/10 rounded-full h-1.5">
            <div
              className="bg-title h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((s.day - 1) * GAME_CONFIG.questionsPerDay + store.dayQuestionIndex) / (GAME_CONFIG.maxDay * GAME_CONFIG.questionsPerDay) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-title/60">{Math.round(((s.day - 1) * GAME_CONFIG.questionsPerDay + store.dayQuestionIndex) / (GAME_CONFIG.maxDay * GAME_CONFIG.questionsPerDay) * 100)}%</span>
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

            {pending.verdict && (
              <div className={`rounded-xl px-3 py-2 text-center ${
                pending.verdict.startsWith("推荐") ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"
              }`}>
                <span className={`text-sm font-black ${
                  pending.verdict.startsWith("推荐") ? "text-green-700" : "text-orange-700"
                }`}>
                  {pending.verdict.startsWith("推荐") ? "✅ " : "⚠️ "}{pending.verdict}
                </span>
              </div>
            )}

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

            {pending.realCase && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">📋</span>
                  <div>
                    <p className="text-[11px] font-bold text-blue-700 mb-1">实战案例</p>
                    <p className="text-[13px] text-blue-900 leading-relaxed">{pending.realCase}</p>
                  </div>
                </div>
              </div>
            )}

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
                    verdict: opt.verdict,
                    realCase: question.realCase,
                  });
                  track("answer_choice", { qid: question.id, opt: idx });
                  // 答对题（任意正向经营改善）→ 疯狂掉金币 + 音效
                  if (isWinChoice(opt.effect)) {
                    triggerCoinRain();
                  }
                }}
                className="btn-raised-card"
              >
                <p className="text-sm font-bold text-title leading-snug">{opt.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 掉金币特效层 */}
      {showCoin && <CoinRain key={coinKey} />}

      <p className="text-center text-[10px] text-secondary/40 pt-4">v4.2.6</p>
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
  if (effect.enterConversion !== undefined && effect.enterConversion !== 0) {
    chips.push({
      text: `入店率 ${effect.enterConversion > 0 ? "+" : ""}${(effect.enterConversion * 100).toFixed(1)}%`,
      cls: effect.enterConversion > 0 ? positive : negative,
    });
  }
  if (effect.orderConversion !== undefined && effect.orderConversion !== 0) {
    chips.push({
      text: `下单率 ${effect.orderConversion > 0 ? "+" : ""}${(effect.orderConversion * 100).toFixed(1)}%`,
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
