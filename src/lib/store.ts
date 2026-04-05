"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Question,
  AnswerRecord,
  StoreState,
  UpgradeCategory,
  RankTier,
} from "./types";
import {
  GAME_CONFIG,
  getResultLevel,
  getRandomUpgradeChoices,
  getRandomTip,
  processRoundResult,
  INITIAL_TIER,
} from "./config";

export type GamePhase =
  | "home"
  | "playing"
  | "upgrade"
  | "upgrade-feedback"
  | "answered-wrong"
  | "result"
  | "reward";

interface GameStore {
  phase: GamePhase;
  questions: Question[];
  currentIndex: number;
  answers: AnswerRecord[];
  storeState: StoreState;
  upgradeChoices: ReturnType<typeof getRandomUpgradeChoices>;
  lastAnswerCorrect: boolean | null;
  lastFeedbackText: string;
  lastUpgradeTip: string;
  lastAnsweredQuestion: Question | null;
  lastSelectedLabel: string;

  // === 等级系统 ===
  currentTier: RankTier;
  highestTier: RankTier;
  lastRoundPassed: boolean;
  lastRoundPromoted: boolean;
  lastRoundPreviousTier: RankTier;
  nextRoundUnlocked: boolean;
  totalRoundsPlayed: number;
  totalPassRounds: number;

  // === 排行榜 ===
  displayName: string;
  hasSubmittedDisplayName: boolean;
  displayNameEditCount: number;

  // === 持久化 ===
  totalPlays: number;
  bestScore: number;
  bestCorrectCount: number;
  bestRank: string;
  answeredQuestionIds: number[];

  // Computed
  totalScore: () => number;
  correctCount: () => number;
  currentQuestion: () => Question | null;
  resultLevel: () => ReturnType<typeof getResultLevel>;
  progress: () => number;
  canPlay: () => boolean;

  // Actions
  startGame: (allQuestions: Question[]) => void;
  submitAnswer: (label: string) => void;
  selectUpgrade: (category: UpgradeCategory) => void;
  nextQuestion: () => void;
  goToResult: () => void;
  goToReward: () => void;
  markSharedForNextRound: () => void;
  setDisplayName: (name: string) => void;
  reset: () => void;
}

const initialStoreState: StoreState = {
  storefront: 0,
  menu: 0,
  kitchen: 0,
  traffic: 0,
  reputation: 0,
  member: 0,
};

function pickRandomQuestions(
  all: Question[],
  count: number,
  excludeIds: number[]
): Question[] {
  const excludeSet = new Set(excludeIds);
  let pool = all.filter((q) => !excludeSet.has(q.id));
  if (pool.length < count) {
    pool = [...all];
  }
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      phase: "home",
      questions: [],
      currentIndex: 0,
      answers: [],
      storeState: { ...initialStoreState },
      upgradeChoices: [],
      lastAnswerCorrect: null,
      lastFeedbackText: "",
      lastUpgradeTip: "",
      lastAnsweredQuestion: null,
      lastSelectedLabel: "",

      // 等级系统
      currentTier: INITIAL_TIER,
      highestTier: INITIAL_TIER,
      lastRoundPassed: false,
      lastRoundPromoted: false,
      lastRoundPreviousTier: INITIAL_TIER,
      nextRoundUnlocked: true, // 初始可以免费玩第一轮
      totalRoundsPlayed: 0,
      totalPassRounds: 0,

      // 排行榜
      displayName: "",
      hasSubmittedDisplayName: false,
      displayNameEditCount: 0,

      // 持久化
      totalPlays: 0,
      bestScore: 0,
      bestCorrectCount: 0,
      bestRank: "",
      answeredQuestionIds: [],

      totalScore: () => get().answers.reduce((sum, a) => sum + a.earnedScore, 0),
      correctCount: () => get().answers.filter((a) => a.isCorrect).length,
      currentQuestion: () => get().questions[get().currentIndex] ?? null,
      resultLevel: () => getResultLevel(get().totalScore()),
      progress: () => {
        const total = get().questions.length;
        return total === 0 ? 0 : (get().currentIndex / total) * 100;
      },

      // 能否开始新一轮：必须 nextRoundUnlocked
      canPlay: () => get().nextRoundUnlocked,

      startGame: (allQuestions) => {
        const state = get();

        if (!state.nextRoundUnlocked) return;

        const selected = pickRandomQuestions(
          allQuestions,
          GAME_CONFIG.questionCount,
          state.answeredQuestionIds
        );

        set({
          phase: "playing",
          questions: selected,
          currentIndex: 0,
          answers: [],
          upgradeChoices: [],
          lastAnswerCorrect: null,
          lastFeedbackText: "",
          lastRoundPassed: false,
          lastRoundPromoted: false,
          lastRoundPreviousTier: state.currentTier,
          nextRoundUnlocked: false, // 新一轮开始后，下一轮资格重置
          totalPlays: state.totalPlays + 1,
        });
      },

      submitAnswer: (label) => {
        const state = get();
        const question = state.currentQuestion();
        if (!question) return;

        const selectedOption = question.options.find((o) => o.label === label);
        const isCorrect = selectedOption?.isCorrect ?? false;
        const earnedScore = isCorrect ? question.score : 0;

        const record: AnswerRecord = {
          questionId: question.id,
          selectedLabel: label,
          isCorrect,
          earnedScore,
        };

        const newAnswers = [...state.answers, record];

        if (isCorrect) {
          const choices = getRandomUpgradeChoices(3);
          set({
            answers: newAnswers,
            lastAnswerCorrect: true,
            upgradeChoices: choices,
            lastAnsweredQuestion: question,
            lastSelectedLabel: label,
            phase: "upgrade",
          });
        } else {
          set({
            answers: newAnswers,
            lastAnswerCorrect: false,
            lastAnsweredQuestion: question,
            lastSelectedLabel: label,
            phase: "answered-wrong",
          });
        }
      },

      selectUpgrade: (category) => {
        const state = get();
        const choice = state.upgradeChoices.find((c) => c.category === category);
        if (!choice) return;

        const newStore = { ...state.storeState };
        newStore[category] = Math.min(newStore[category] + 1, 10);

        set({
          storeState: newStore,
          lastFeedbackText: choice.feedbackText,
          lastUpgradeTip: getRandomTip(category),
          phase: "upgrade-feedback",
        });
      },

      nextQuestion: () => {
        const state = get();
        const nextIdx = state.currentIndex + 1;

        if (nextIdx >= state.questions.length) {
          // 本轮结束 - 处理等级晋级
          const finalScore = state.totalScore();
          const finalCorrect = state.correctCount();
          const newAnsweredIds = [
            ...state.answeredQuestionIds,
            ...state.questions.map((q) => q.id),
          ];

          const result = processRoundResult(state.currentTier, finalScore);

          const updates: Partial<GameStore> = {
            phase: "result" as const,
            answeredQuestionIds: newAnsweredIds,
            currentTier: result.newTier,
            lastRoundPassed: result.passed,
            lastRoundPromoted: result.promoted,
            nextRoundUnlocked: result.nextRoundUnlocked,
            totalRoundsPlayed: state.totalRoundsPlayed + 1,
            totalPassRounds: result.passed
              ? state.totalPassRounds + 1
              : state.totalPassRounds,
          };

          // 更新最高等级
          if (result.promoted) {
            updates.highestTier = result.newTier;
          }

          // 更新最佳分数
          if (finalScore > state.bestScore) {
            updates.bestScore = finalScore;
            updates.bestCorrectCount = finalCorrect;
            updates.bestRank = getResultLevel(finalScore).title;
          }

          set(updates);
        } else {
          set({
            currentIndex: nextIdx,
            phase: "playing",
            lastAnswerCorrect: null,
            lastFeedbackText: "",
          });
        }
      },

      goToResult: () => {
        const state = get();
        const finalScore = state.totalScore();
        const finalCorrect = state.correctCount();
        const newAnsweredIds = [
          ...state.answeredQuestionIds,
          ...state.questions.map((q) => q.id),
        ];

        const result = processRoundResult(state.currentTier, finalScore);

        const updates: Partial<GameStore> = {
          phase: "result" as const,
          answeredQuestionIds: newAnsweredIds,
          currentTier: result.newTier,
          lastRoundPassed: result.passed,
          lastRoundPromoted: result.promoted,
          nextRoundUnlocked: result.nextRoundUnlocked,
          totalRoundsPlayed: state.totalRoundsPlayed + 1,
          totalPassRounds: result.passed
            ? state.totalPassRounds + 1
            : state.totalPassRounds,
        };

        if (result.promoted) {
          updates.highestTier = result.newTier;
        }

        if (finalScore > state.bestScore) {
          updates.bestScore = finalScore;
          updates.bestCorrectCount = finalCorrect;
          updates.bestRank = getResultLevel(finalScore).title;
        }

        set(updates);
      },

      goToReward: () => set({ phase: "reward" }),

      /** 分享解锁下一轮（仅本轮未达标时使用） */
      markSharedForNextRound: () => {
        set({ nextRoundUnlocked: true });
      },

      /** 设置排行榜展示名称 */
      setDisplayName: (name: string) => {
        const state = get();
        const trimmed = name.trim().slice(0, 20);
        if (trimmed.length < 2) return;

        const updates: Partial<GameStore> = {
          displayName: trimmed,
        };

        if (!state.hasSubmittedDisplayName) {
          updates.hasSubmittedDisplayName = true;
          updates.displayNameEditCount = 0;
        } else {
          updates.displayNameEditCount = state.displayNameEditCount + 1;
        }

        set(updates);
      },

      reset: () =>
        set({
          phase: "home",
          questions: [],
          currentIndex: 0,
          answers: [],
          upgradeChoices: [],
          lastAnswerCorrect: null,
          lastFeedbackText: "",
        }),
    }),
    {
      name: "waimai-quiz-progress",
      partialize: (state) => ({
        storeState: state.storeState,
        currentTier: state.currentTier,
        highestTier: state.highestTier,
        nextRoundUnlocked: state.nextRoundUnlocked,
        totalRoundsPlayed: state.totalRoundsPlayed,
        totalPassRounds: state.totalPassRounds,
        displayName: state.displayName,
        hasSubmittedDisplayName: state.hasSubmittedDisplayName,
        displayNameEditCount: state.displayNameEditCount,
        totalPlays: state.totalPlays,
        bestScore: state.bestScore,
        bestCorrectCount: state.bestCorrectCount,
        bestRank: state.bestRank,
        answeredQuestionIds: state.answeredQuestionIds,
      }),
    }
  )
);
