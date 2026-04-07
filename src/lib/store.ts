"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GameState,
  SimQuestion,
  ChoiceRecord,
  DaySummary,
  DayChoiceLogItem,
  EndingType,
  PlayerTag,
  RandomEvent,
  OptionEffect,
} from "./types";
import {
  GAME_CONFIG,
  INITIAL_STATE,
  DAILY_COST,
  applyEffect,
  calcDailyRevenue,
  QUESTION_BANK,
  RANDOM_EVENTS,
  determineEnding,
  determinePlayerTag,
  generateDailyComment,
} from "./config";

export type GamePhase =
  | "home"
  | "day-intro"     // 每日背景展示
  | "playing"       // 答题中
  | "day-settle"    // 每日结算
  | "result"        // 最终结局
  | "reward";       // 引流页

interface GameStore {
  phase: GamePhase;

  // 当前局状态
  state: GameState;
  dayQuestions: SimQuestion[];    // 本日要答的题
  dayQuestionIndex: number;       // 本日答到第几题
  dayEvent: RandomEvent | null;   // 本日触发的事件
  choices: ChoiceRecord[];        // 所有选择记录

  // 本日累计
  dayCashBefore: number;          // 本日开始时的现金
  dayChoiceImpact: number;        // 本日题目带来的现金变化累计
  dayExposureStart: number;
  dayChoiceLog: DayChoiceLogItem[]; // 本日决策记录（用于结算回顾）

  // 每日历史
  dailySummaries: DaySummary[];

  // 结局
  endingType: EndingType | null;
  playerTag: PlayerTag | null;

  // 持久化字段
  totalPlays: number;
  bestFinalCash: number;
  bestDaysSurvived: number;

  // 裂变：每日次数+分享解锁
  freePlaysPerDay: number;
  playsToday: number;
  lastPlayDate: string;
  sharedPlaysToday: number;
  maxSharedPlays: number;

  // 展示名（排行榜兼容）
  displayName: string;
  hasSubmittedDisplayName: boolean;

  // Computed
  currentQuestion: () => SimQuestion | null;
  canPlay: () => boolean;
  remainingFreePlays: () => number;
  todaysRevenue: () => number;
  dayProgress: () => number;

  // Actions
  startNewGame: () => void;
  startDay: () => void;
  submitChoice: (optionIndex: number) => void;
  nextQuestion: () => void;
  applyDailySettlement: () => void;
  nextDay: () => void;
  markSharedForExtraPlay: () => void;
  setDisplayName: (name: string) => void;
  goToReward: () => void;
  reset: () => void;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function pickQuestions(count: number, excludeIds: string[]): SimQuestion[] {
  const available = QUESTION_BANK.filter((q) => !excludeIds.includes(q.id));
  const pool = available.length >= count ? available : QUESTION_BANK;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

function pickRandomEvent(day: number): RandomEvent | null {
  // 第1天不触发事件，让玩家先适应
  if (day === 1) return null;
  // 70% 概率触发
  if (Math.random() > 0.7) return null;
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      phase: "home",
      state: { ...INITIAL_STATE },
      dayQuestions: [],
      dayQuestionIndex: 0,
      dayEvent: null,
      choices: [],
      dayCashBefore: INITIAL_STATE.cash,
      dayChoiceImpact: 0,
      dayExposureStart: INITIAL_STATE.exposure,
      dayChoiceLog: [],
      dailySummaries: [],
      endingType: null,
      playerTag: null,

      totalPlays: 0,
      bestFinalCash: 0,
      bestDaysSurvived: 0,

      freePlaysPerDay: 3,
      playsToday: 0,
      lastPlayDate: "",
      sharedPlaysToday: 0,
      maxSharedPlays: 2,

      displayName: "",
      hasSubmittedDisplayName: false,

      currentQuestion: () => {
        const s = get();
        return s.dayQuestions[s.dayQuestionIndex] ?? null;
      },

      canPlay: () => {
        const s = get();
        const today = todayStr();
        if (s.lastPlayDate !== today) return true;
        return s.playsToday < s.freePlaysPerDay + s.sharedPlaysToday;
      },

      remainingFreePlays: () => {
        const s = get();
        const today = todayStr();
        if (s.lastPlayDate !== today) return s.freePlaysPerDay;
        return Math.max(0, s.freePlaysPerDay + s.sharedPlaysToday - s.playsToday);
      },

      todaysRevenue: () => {
        const s = get();
        return calcDailyRevenue(s.state);
      },

      dayProgress: () => {
        const s = get();
        return s.dayQuestions.length === 0
          ? 0
          : (s.dayQuestionIndex / s.dayQuestions.length) * 100;
      },

      startNewGame: () => {
        const s = get();
        const today = todayStr();
        const playsToday = s.lastPlayDate === today ? s.playsToday + 1 : 1;
        const sharedPlaysToday = s.lastPlayDate === today ? s.sharedPlaysToday : 0;

        set({
          phase: "day-intro",
          state: { ...INITIAL_STATE },
          dayQuestions: [],
          dayQuestionIndex: 0,
          dayEvent: null,
          choices: [],
          dayCashBefore: INITIAL_STATE.cash,
          dayChoiceImpact: 0,
          dayExposureStart: INITIAL_STATE.exposure,
          dayChoiceLog: [],
          dailySummaries: [],
          endingType: null,
          playerTag: null,
          totalPlays: s.totalPlays + 1,
          lastPlayDate: today,
          playsToday,
          sharedPlaysToday,
        });

        // 直接进入第一天
        get().startDay();
      },

      startDay: () => {
        const s = get();
        const excludeIds = s.choices.map((c) => c.questionId);
        const qs = pickQuestions(GAME_CONFIG.questionsPerDay, excludeIds);
        const event = pickRandomEvent(s.state.day);

        let newState = s.state;
        if (event) {
          newState = applyEffect(newState, event.effect);
        }

        set({
          phase: "day-intro",
          state: newState,
          dayQuestions: qs,
          dayQuestionIndex: 0,
          dayEvent: event,
          dayCashBefore: newState.cash,
          dayChoiceImpact: 0,
          dayExposureStart: newState.exposure,
          dayChoiceLog: [],
        });
      },

      submitChoice: (optionIndex: number) => {
        const s = get();
        const q = s.currentQuestion();
        if (!q) return;

        const option = q.options[optionIndex];
        if (!option) return;

        const newState = applyEffect(s.state, option.effect);
        const record: ChoiceRecord = {
          questionId: q.id,
          optionIndex,
          day: s.state.day,
          effect: option.effect,
        };
        const logItem: DayChoiceLogItem = {
          questionTitle: q.title,
          optionText: option.text,
          cashDelta: option.effect.cash ?? 0,
          effects: option.effect,
        };

        set({
          state: newState,
          choices: [...s.choices, record],
          dayChoiceImpact: s.dayChoiceImpact + (option.effect.cash ?? 0),
          dayChoiceLog: [...s.dayChoiceLog, logItem],
        });
      },

      nextQuestion: () => {
        const s = get();
        const nextIdx = s.dayQuestionIndex + 1;
        if (nextIdx >= s.dayQuestions.length) {
          get().applyDailySettlement();
        } else {
          set({ dayQuestionIndex: nextIdx, phase: "playing" });
        }
      },

      applyDailySettlement: () => {
        const s = get();
        const revenue = calcDailyRevenue(s.state);
        const fixedCost = DAILY_COST;
        const profit = revenue - fixedCost + s.dayChoiceImpact;
        const cashAfter = s.state.cash + revenue - fixedCost;

        const newState: GameState = { ...s.state, cash: cashAfter };

        const avgPriceDelta = newState.avgPrice - INITIAL_STATE.avgPrice;
        const comment = generateDailyComment({
          profit,
          revenue,
          exposure: newState.exposure,
          badReviewRate: newState.badReviewRate,
          avgPriceDelta,
        });

        // 营业额公式分解
        const effectiveOrderConv =
          s.state.orderConversion * (1 - s.state.badReviewRate * 0.5);
        const estimatedOrders = Math.round(
          s.state.exposure * s.state.enterConversion * effectiveOrderConv
        );

        const summary: DaySummary = {
          day: s.state.day,
          incomeRevenue: revenue,
          fixedCost,
          choiceImpact: s.dayChoiceImpact,
          profit,
          cashBefore: s.dayCashBefore,
          cashAfter,
          exposureEnd: newState.exposure,
          enterConversionEnd: newState.enterConversion,
          orderConversionEnd: newState.orderConversion,
          badReviewEnd: newState.badReviewRate,
          avgPriceEnd: newState.avgPrice,
          estimatedOrders,
          effectiveOrderConv,
          choiceLog: [...s.dayChoiceLog],
          comment,
          eventTitle: s.dayEvent?.title,
          eventEmoji: s.dayEvent?.emoji,
          eventDesc: s.dayEvent?.desc,
        };

        set({
          state: newState,
          dailySummaries: [...s.dailySummaries, summary],
          phase: "day-settle",
        });

        // 判定倒闭
        if (cashAfter <= 0) {
          setTimeout(() => get().nextDay(), 0);
        }
      },

      nextDay: () => {
        const s = get();
        const cashAfter = s.state.cash;

        // 倒闭
        if (cashAfter <= 0) {
          const totalAdSpend = s.choices
            .filter((c) => (c.effect.exposure ?? 0) >= 30)
            .reduce((sum, c) => sum + Math.abs(c.effect.cash ?? 0), 0);
          const avgPriceChange = s.state.avgPrice - INITIAL_STATE.avgPrice;
          const ending: EndingType = "bankrupt";
          const tag = determinePlayerTag(ending, s.state, avgPriceChange, totalAdSpend);
          const bestCash = Math.max(s.bestFinalCash, s.state.cash);
          const bestDays = Math.max(s.bestDaysSurvived, s.state.day);
          set({
            phase: "result",
            endingType: ending,
            playerTag: tag,
            bestFinalCash: bestCash,
            bestDaysSurvived: bestDays,
          });
          return;
        }

        // 通关
        if (s.state.day >= GAME_CONFIG.maxDay) {
          const totalAdSpend = s.choices
            .filter((c) => (c.effect.exposure ?? 0) >= 30)
            .reduce((sum, c) => sum + Math.abs(c.effect.cash ?? 0), 0);
          const avgPriceChange = s.state.avgPrice - INITIAL_STATE.avgPrice;
          const ending = determineEnding(
            s.state.cash,
            GAME_CONFIG.initialCash,
            s.state.day
          );
          const tag = determinePlayerTag(ending, s.state, avgPriceChange, totalAdSpend);
          const bestCash = Math.max(s.bestFinalCash, s.state.cash);
          const bestDays = Math.max(s.bestDaysSurvived, s.state.day);
          set({
            phase: "result",
            endingType: ending,
            playerTag: tag,
            bestFinalCash: bestCash,
            bestDaysSurvived: bestDays,
          });
          return;
        }

        // 进入下一天
        set({
          state: { ...s.state, day: s.state.day + 1 },
        });
        get().startDay();
      },

      markSharedForExtraPlay: () => {
        const s = get();
        if (s.sharedPlaysToday >= s.maxSharedPlays) return;
        set({ sharedPlaysToday: s.sharedPlaysToday + 1 });
      },

      setDisplayName: (name: string) => {
        const trimmed = name.trim().slice(0, 20);
        if (trimmed.length < 2) return;
        set({ displayName: trimmed, hasSubmittedDisplayName: true });
      },

      goToReward: () => set({ phase: "reward" }),

      reset: () =>
        set({
          phase: "home",
          state: { ...INITIAL_STATE },
          dayQuestions: [],
          dayQuestionIndex: 0,
          dayEvent: null,
          choices: [],
          dayCashBefore: INITIAL_STATE.cash,
          dayChoiceImpact: 0,
          dayExposureStart: INITIAL_STATE.exposure,
          dayChoiceLog: [],
          dailySummaries: [],
          endingType: null,
          playerTag: null,
        }),
    }),
    {
      name: "waimai-sim-progress",
      partialize: (state) => ({
        totalPlays: state.totalPlays,
        bestFinalCash: state.bestFinalCash,
        bestDaysSurvived: state.bestDaysSurvived,
        playsToday: state.playsToday,
        lastPlayDate: state.lastPlayDate,
        sharedPlaysToday: state.sharedPlaysToday,
        displayName: state.displayName,
        hasSubmittedDisplayName: state.hasSubmittedDisplayName,
      }),
    }
  )
);
