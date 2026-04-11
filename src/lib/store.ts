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
  DiagnosisReport,
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
  pickQuestionsForDay,
  generateDiagnosisReport,
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
  diagnosisReport: DiagnosisReport | null;

  // 持久化字段
  totalPlays: number;
  bestFinalCash: number;
  bestDaysSurvived: number;

  // 裂变：每日次数+分享解锁
  freePlaysPerDay: number;        // 每天免费次数
  playsToday: number;             // 今天已玩次数
  lastPlayDate: string;
  sharedPlaysToday: number;       // 今天通过【自己分享海报】解锁的次数
  maxSharedPlays: number;         // 自分享解锁次数上限
  inviteCredits: number;          // 通过【别人扫码】累积的额外次数（来自后端）
  inviteScannerCount: number;     // 已被多少人扫码（统计展示用）
  inviteCap: number;              // 邀请扫码上限（来自后端）
  inviteCreditsConsumed: number;  // 已经用掉的邀请次数

  // 玩家身份（用于裂变追踪）
  playerId: string;

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

  // 裂变 actions
  ensurePlayerId: () => string;
  refreshInviteCredits: () => Promise<void>;
  recordInviteScan: (inviterId: string) => Promise<{ credited: boolean; reason: string }>;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function generatePlayerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const API_BASE = "/api";

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
      diagnosisReport: null,

      totalPlays: 0,
      bestFinalCash: 0,
      bestDaysSurvived: 0,

      freePlaysPerDay: 3,           // 每天免费 3 次
      playsToday: 0,
      lastPlayDate: "",
      sharedPlaysToday: 0,
      maxSharedPlays: 5,            // 自分享海报每天最多 +5 次（之前是 1，太严格，会让用户分享后看不到效果）
      inviteCredits: 0,
      inviteScannerCount: 0,
      inviteCap: 5,
      inviteCreditsConsumed: 0,

      playerId: "",

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
        // 总可用 = 免费次数 + 分享解锁次数 + 邀请额度
        const inviteAvailable = Math.max(0, s.inviteCredits - s.inviteCreditsConsumed);
        const totalAvailable = s.freePlaysPerDay + s.sharedPlaysToday + inviteAvailable;
        return s.playsToday < totalAvailable;
      },

      remainingFreePlays: () => {
        const s = get();
        const today = todayStr();
        if (s.lastPlayDate !== today) {
          const inviteAvailable = Math.max(0, s.inviteCredits - s.inviteCreditsConsumed);
          return s.freePlaysPerDay + inviteAvailable;
        }
        const inviteAvailable = Math.max(0, s.inviteCredits - s.inviteCreditsConsumed);
        const totalAvailable = s.freePlaysPerDay + s.sharedPlaysToday + inviteAvailable;
        return Math.max(0, totalAvailable - s.playsToday);
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
        const isNewDay = s.lastPlayDate !== today;
        const playsToday = isNewDay ? 1 : s.playsToday + 1;

        // 如果超过每日免费次数，消耗邀请额度
        let inviteCreditsConsumed = isNewDay ? 0 : s.inviteCreditsConsumed;
        if (!isNewDay && playsToday > s.freePlaysPerDay) {
          inviteCreditsConsumed = inviteCreditsConsumed + 1;
        }

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
          diagnosisReport: null,
          totalPlays: s.totalPlays + 1,
          lastPlayDate: today,
          playsToday,
          sharedPlaysToday: isNewDay ? 0 : s.sharedPlaysToday, // 不要重置当天的分享次数！
          inviteCreditsConsumed,
        });
        get().startDay();
      },

      startDay: () => {
        const s = get();
        const excludeIds = s.choices.map((c) => c.questionId);
        const qs = pickQuestionsForDay(s.state.day, excludeIds);
        // 打乱每道题的选项顺序，避免正确答案永远是第一个
        const shuffledQs = qs.map((q) => ({
          ...q,
          options: [...q.options].sort(() => Math.random() - 0.5),
        }));
        const event = pickRandomEvent(s.state.day);

        let newState = s.state;
        if (event) {
          newState = applyEffect(newState, event.effect);
        }

        set({
          phase: "day-intro",
          state: newState,
          dayQuestions: shuffledQs,
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
          const diagnosis = generateDiagnosisReport(ending, s.state, s.dailySummaries, totalAdSpend, avgPriceChange);
          const bestCash = Math.max(s.bestFinalCash, s.state.cash);
          const bestDays = Math.max(s.bestDaysSurvived, s.state.day);
          set({
            phase: "result",
            endingType: ending,
            playerTag: tag,
            diagnosisReport: diagnosis,
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
          const diagnosis = generateDiagnosisReport(ending, s.state, s.dailySummaries, totalAdSpend, avgPriceChange);
          const bestCash = Math.max(s.bestFinalCash, s.state.cash);
          const bestDays = Math.max(s.bestDaysSurvived, s.state.day);
          set({
            phase: "result",
            endingType: ending,
            playerTag: tag,
            diagnosisReport: diagnosis,
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
        const today = todayStr();
        // 跨天先重置自分享计数
        if (s.lastPlayDate !== today) {
          set({ lastPlayDate: today, sharedPlaysToday: 1, playsToday: 0 });
          return;
        }
        if (s.sharedPlaysToday >= s.maxSharedPlays) return;
        set({ sharedPlaysToday: s.sharedPlaysToday + 1 });
      },

      ensurePlayerId: () => {
        const s = get();
        if (s.playerId) return s.playerId;
        const id = generatePlayerId();
        set({ playerId: id });
        return id;
      },

      refreshInviteCredits: async () => {
        const s = get();
        const id = s.playerId || get().ensurePlayerId();
        try {
          const res = await fetch(
            `${API_BASE}/invite/credits?player=${encodeURIComponent(id)}`
          );
          if (!res.ok) return;
          const data = await res.json();
          set({
            inviteCredits: data.credits ?? 0,
            inviteScannerCount: data.scannerCount ?? 0,
            inviteCap: data.cap ?? 5,
          });
        } catch {
          // 静默失败，不影响游戏主流程
        }
      },

      recordInviteScan: async (inviterId: string) => {
        const scanner = get().playerId || get().ensurePlayerId();
        try {
          const res = await fetch(`${API_BASE}/invite/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviter: inviterId, scanner }),
          });
          if (!res.ok) return { credited: false, reason: "http_error" };
          const data = await res.json();
          return { credited: !!data.credited, reason: data.reason || "unknown" };
        } catch {
          return { credited: false, reason: "network_error" };
        }
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
          diagnosisReport: null,
        }),
    }),
    {
      name: "waimai-sim-progress",
      // v2 (2026-04-09): 次数模型从「免费 3 + 分享 2」改为「免费 1 + 自分享 1 + 邀请扫码 +N」
      // 旧 playsToday / sharedPlaysToday 在新 schema 下含义错位，老用户进来会立刻被锁死
      // 这里强制把它们清零，让所有老用户的当日次数从 0 开始，立即可玩
      version: 2,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const s = (persistedState ?? {}) as Record<string, unknown>;
        if (fromVersion < 2) {
          return {
            ...s,
            playsToday: 0,
            sharedPlaysToday: 0,
            lastPlayDate: "",
            inviteCredits: typeof s.inviteCredits === "number" ? s.inviteCredits : 0,
            inviteCreditsConsumed: 0,
            inviteScannerCount: typeof s.inviteScannerCount === "number" ? s.inviteScannerCount : 0,
          };
        }
        return s;
      },
      partialize: (state) => ({
        totalPlays: state.totalPlays,
        bestFinalCash: state.bestFinalCash,
        bestDaysSurvived: state.bestDaysSurvived,
        playsToday: state.playsToday,
        lastPlayDate: state.lastPlayDate,
        sharedPlaysToday: state.sharedPlaysToday,
        inviteCredits: state.inviteCredits,
        inviteScannerCount: state.inviteScannerCount,
        inviteCreditsConsumed: state.inviteCreditsConsumed,
        playerId: state.playerId,
        displayName: state.displayName,
        hasSubmittedDisplayName: state.hasSubmittedDisplayName,
      }),
    }
  )
);
