"use client";

import { create } from "zustand";
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

  // Computed
  totalScore: () => number;
  correctCount: () => number;
  currentQuestion: () => Question | null;
  resultLevel: () => ReturnType<typeof getResultLevel>;
  progress: () => number;

  // Actions
  startGame: (allQuestions: Question[]) => void;
  submitAnswer: (label: string) => void;
  selectUpgrade: (category: UpgradeCategory) => void;
  nextQuestion: () => void;
  goToResult: () => void;
  goToReward: () => void;
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

export const useGameStore = create<GameStore>((set, get) => ({
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

  totalScore: () => get().answers.reduce((sum, a) => sum + a.earnedScore, 0),
  correctCount: () => get().answers.filter((a) => a.isCorrect).length,
  currentQuestion: () => get().questions[get().currentIndex] ?? null,
  resultLevel: () => getResultLevel(get().totalScore()),
  progress: () => {
    const total = get().questions.length;
    return total === 0 ? 0 : ((get().currentIndex) / total) * 100;
  },

  startGame: (allQuestions) => {
    const selected = pickRandomQuestions(
      allQuestions,
      GAME_CONFIG.questionCount
    );
    set({
      phase: "playing",
      questions: selected,
      currentIndex: 0,
      answers: [],
      storeState: { ...initialStoreState },
      upgradeChoices: [],
      lastAnswerCorrect: null,
      lastFeedbackText: "",
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
      set({ phase: "result" });
    } else {
      set({
        currentIndex: nextIdx,
        phase: "playing",
        lastAnswerCorrect: null,
        lastFeedbackText: "",
      });
    }
  },

  goToResult: () => set({ phase: "result" }),
  goToReward: () => set({ phase: "reward" }),

  reset: () =>
    set({
      phase: "home",
      questions: [],
      currentIndex: 0,
      answers: [],
      storeState: { ...initialStoreState },
      upgradeChoices: [],
      lastAnswerCorrect: null,
      lastFeedbackText: "",
    }),
}));
