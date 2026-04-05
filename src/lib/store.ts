"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Question,
  AnswerRecord,
  StoreState,
  UpgradeCategory,
} from "./types";
import { GAME_CONFIG, getResultLevel, getRandomUpgradeChoices, getRandomTip } from "./config";

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

  // Persistence fields
  dailyPlays: number;
  lastPlayDate: string;
  todayShareCount: number;
  totalPlays: number;
  bestScore: number;
  bestRank: string;
  answeredQuestionIds: number[];

  // Computed
  totalScore: () => number;
  correctCount: () => number;
  currentQuestion: () => Question | null;
  resultLevel: () => ReturnType<typeof getResultLevel>;
  progress: () => number;
  canPlay: () => boolean;
  maxDailyPlays: () => number;
  remainingPlays: () => number;

  // Actions
  startGame: (allQuestions: Question[]) => void;
  submitAnswer: (label: string) => void;
  selectUpgrade: (category: UpgradeCategory) => void;
  nextQuestion: () => void;
  goToResult: () => void;
  goToReward: () => void;
  markShared: () => void;
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
  // If not enough unanswered questions, reset and use all
  if (pool.length < count) {
    pool = [...all];
  }
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
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

      // Persistence fields
      dailyPlays: 0,
      lastPlayDate: "",
      todayShareCount: 0,
      totalPlays: 0,
      bestScore: 0,
      bestRank: "",
      answeredQuestionIds: [],

      totalScore: () => get().answers.reduce((sum, a) => sum + a.earnedScore, 0),
      correctCount: () => get().answers.filter((a) => a.isCorrect).length,
      currentQuestion: () => get().questions[get().currentIndex] ?? null,
      resultLevel: () => getResultLevel(get().totalScore()),
      progress: () => {
        const total = get().questions.length;
        return total === 0 ? 0 : ((get().currentIndex) / total) * 100;
      },

      // 1 free play + 1 per share, no cap
      maxDailyPlays: () => 1 + get().todayShareCount,
      canPlay: () => {
        const state = get();
        const today = getToday();
        if (state.lastPlayDate !== today) return true;
        return state.dailyPlays < state.maxDailyPlays();
      },
      remainingPlays: () => {
        const state = get();
        const today = getToday();
        const shares = state.lastPlayDate !== today ? 0 : state.todayShareCount;
        const plays = state.lastPlayDate !== today ? 0 : state.dailyPlays;
        return Math.max(0, 1 + shares - plays);
      },

      startGame: (allQuestions) => {
        const state = get();
        const today = getToday();

        // Reset daily counters if new day
        const isNewDay = state.lastPlayDate !== today;
        const currentDailyPlays = isNewDay ? 0 : state.dailyPlays;
        const currentShareCount = isNewDay ? 0 : state.todayShareCount;
        const maxPlays = 1 + currentShareCount;

        if (currentDailyPlays >= maxPlays) return;

        const selected = pickRandomQuestions(
          allQuestions,
          GAME_CONFIG.questionCount,
          isNewDay ? [] : state.answeredQuestionIds
        );

        // Keep storeState across games (persistent progression)
        set({
          phase: "playing",
          questions: selected,
          currentIndex: 0,
          answers: [],
          upgradeChoices: [],
          lastAnswerCorrect: null,
          lastFeedbackText: "",
          dailyPlays: currentDailyPlays + 1,
          lastPlayDate: today,
          todayShareCount: currentShareCount,
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
          const finalScore = state.totalScore();
          const newAnsweredIds = [...state.answeredQuestionIds, ...state.questions.map((q) => q.id)];
          const updates: Partial<GameStore> = {
            phase: "result" as const,
            answeredQuestionIds: newAnsweredIds,
          };
          if (finalScore > state.bestScore) {
            updates.bestScore = finalScore;
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
        const newAnsweredIds = [...state.answeredQuestionIds, ...state.questions.map((q) => q.id)];
        const updates: Partial<GameStore> = {
          phase: "result" as const,
          answeredQuestionIds: newAnsweredIds,
        };
        if (finalScore > state.bestScore) {
          updates.bestScore = finalScore;
          updates.bestRank = getResultLevel(finalScore).title;
        }
        set(updates);
      },
      goToReward: () => set({ phase: "reward" }),

      markShared: () => {
        const state = get();
        const today = getToday();
        const isNewDay = state.lastPlayDate !== today;
        set({
          todayShareCount: (isNewDay ? 0 : state.todayShareCount) + 1,
          lastPlayDate: today,
        });
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
        dailyPlays: state.dailyPlays,
        lastPlayDate: state.lastPlayDate,
        todayShareCount: state.todayShareCount,
        totalPlays: state.totalPlays,
        bestScore: state.bestScore,
        bestRank: state.bestRank,
        answeredQuestionIds: state.answeredQuestionIds,
      }),
    }
  )
);
