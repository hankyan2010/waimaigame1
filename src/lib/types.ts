export interface QuestionOption {
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  title: string;
  options: QuestionOption[];
  explanation: string;
  category: QuestionCategory;
  difficulty: "easy" | "medium" | "hard";
  score: number;
}

export type QuestionCategory =
  | "traffic"
  | "conversion"
  | "ticket"
  | "retention"
  | "campaign"
  | "menu"
  | "reputation"
  | "kitchen"
  | "location"
  | "strategy";

export interface ResultLevel {
  title: string;
  minScore: number;
  maxScore: number;
  description: string;
  emoji: string;
}

export type UpgradeCategory =
  | "storefront"
  | "menu"
  | "kitchen"
  | "traffic"
  | "reputation"
  | "member";

export interface UpgradeOption {
  category: UpgradeCategory;
  title: string;
  description: string;
  feedbackText: string;
}

export interface StoreState {
  storefront: number;
  menu: number;
  kitchen: number;
  traffic: number;
  reputation: number;
  member: number;
}

export interface AnswerRecord {
  questionId: number;
  selectedLabel: string;
  isCorrect: boolean;
  earnedScore: number;
}

// === 等级系统 ===

export type RankTier =
  | "bronze3"
  | "bronze2"
  | "bronze1"
  | "silver3"
  | "silver2"
  | "silver1"
  | "gold3"
  | "gold2"
  | "gold1"
  | "king3"
  | "king2"
  | "king1";

export interface TierInfo {
  id: RankTier;
  label: string;
  group: "bronze" | "silver" | "gold" | "king";
  emoji: string;
  index: number; // 0-11, 用于排序和进度计算
}

// === 排行榜 ===

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  bestScore: number;
  bestCorrectCount: number;
  highestTier: RankTier;
  createdAt: number;
  updatedAt: number;
}
