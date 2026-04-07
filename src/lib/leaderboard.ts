// 本地排行榜 — 持久化在 localStorage，最多保留 Top 100
import { LeaderboardEntry, EndingType, PlayerTag } from "./types";

const STORAGE_KEY = "waimai-leaderboard-v1";
const MAX_ENTRIES = 100;

function load(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

/** 排名按 7 天净利润降序 */
function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.profit !== a.profit) return b.profit - a.profit;
    if (b.daysSurvived !== a.daysSurvived) return b.daysSurvived - a.daysSurvived;
    return a.createdAt - b.createdAt;
  });
}

export function getLeaderboard(): LeaderboardEntry[] {
  return sortEntries(load()).slice(0, MAX_ENTRIES);
}

/** 算出本次成绩排名（1-based）；不在 Top 100 返回 null */
export function predictRank(profit: number, daysSurvived: number): number | null {
  const entries = sortEntries(load());
  // 找到第一个比当前成绩差的位置
  let rank = 1;
  for (const e of entries) {
    if (
      e.profit > profit ||
      (e.profit === profit && e.daysSurvived > daysSurvived)
    ) {
      rank++;
    } else {
      break;
    }
  }
  return rank <= MAX_ENTRIES ? rank : null;
}

/** 是否能进 Top 100 */
export function canEnterLeaderboard(profit: number, daysSurvived: number): boolean {
  const entries = sortEntries(load());
  if (entries.length < MAX_ENTRIES) return true;
  const last = entries[MAX_ENTRIES - 1];
  if (profit > last.profit) return true;
  if (profit === last.profit && daysSurvived > last.daysSurvived) return true;
  return false;
}

export function submitEntry(
  partial: Omit<LeaderboardEntry, "id" | "createdAt"> & { createdAt?: number }
): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    ...partial,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: partial.createdAt ?? Date.now(),
  };
  const next = sortEntries([...load(), entry]).slice(0, MAX_ENTRIES);
  save(next);
  return entry;
}

export function clearLeaderboard() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export type { LeaderboardEntry, EndingType, PlayerTag };
