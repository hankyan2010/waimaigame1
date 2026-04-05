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
  hasSharedToday: boolean;
  totalPlays: number;
  bestScore: number;
  bestRank: string;

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
  count: number
): Question[] {
  const shuffled = [...all].sort(() => Math.random() - 0.5);
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
      hasSharedToday: false,
      totalPlays: 0,
      bestScore: 0,
      bestRank: "",

      totalScore: () => get().answers.reduce((sum, a) => sum + a.earnedScore, 0),
      correctCount: () => get().answers.filter((a) => a.isCorrect).length,
      currentQuestion: () => get().questions[get().currentIndex] ?? null,
      resultLevel: () => getResultLevel(get().totalScore()),
      progress: () => {
        const total = get().questions.length;
        return total === 0 ? 0 : ((get().currentIndex) / total) * 100;
      },

      maxDailyPlays: () => get().hasSharedToday ? 2 : 1,
      canPlay: () => {
        const state = get();
        const today = getToday();
        if (state.lastPlayDate !== today) return true;
        return state.dailyPlays < state.maxDailyPlays();
      },
      remainingPlays: () => {
        const state = get();
        const today = getToday();
        if (state.lastPlayDate !== today) return state.hasSharedToday ? 2 : 1;
        return Math.max(0, state.maxDailyPlays() - state.dailyPlays);
      },

      startGame: (allQuestions) => {
        const state = get();
        const today = getToday();

        // Reset daily counters if new day
        const isNewDay = state.lastPlayDate !== today;
        const currentDailyPlays = isNewDay ? 0 : state.dailyPlays;
        const currentShared = isNewDay ? false : state.hasSharedToday;
        const maxPlays = currentShared ? 2 : 1;

        if (currentDailyPlays >= maxPlays) return;

        const selected = pickRandomQuestions(
          allQuestions,
          GAME_CONFIG.questionCount
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
          hasSharedToday: currentShared,
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
          // Update best score before transitioning to result
          const finalScore = state.totalScore();
          const updates: Partial<GameStore> = { phase: "result" as const };
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
        const updates: Partial<GameStore> = { phase: "result" as const };
        if (finalScore > state.bestScore) {
          updates.bestScore = finalScore;
          updates.bestRank = getResultLevel(finalScore).title;
        }
        set(updates);
      },
      goToReward: () => set({ phase: "reward" }),

      markShared: () => {
        set({ hasSharedToday: true });
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
          // Note: storeState, dailyPlays, lastPlayDate, hasSharedToday, totalPlays are NOT reset
        }),
    }),
    {
      name: "waimai-quiz-progress",
      partialize: (state) => ({
        storeState: state.storeState,
        dailyPlays: state.dailyPlays,
        lastPlayDate: state.lastPlayDate,
        hasSharedToday: state.hasSharedToday,
        totalPlays: state.totalPlays,
        bestScore: state.bestScore,
        bestRank: state.bestRank,
      }),
    }
  )
);
