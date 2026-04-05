import { RankTier, LeaderboardEntry } from "./types";

const API_BASE = "/api";

/** 提交或更新排行榜成绩 */
export async function submitLeaderboardEntry(data: {
  displayName: string;
  bestScore: number;
  bestCorrectCount: number;
  highestTier: RankTier;
}): Promise<{ ok: boolean; rank?: number }> {
  try {
    const userId = getOrCreateUserId();
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId }),
    });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

/** 获取排行榜（前 100 名 + 当前用户排名） */
export async function fetchLeaderboard(): Promise<{
  entries: LeaderboardEntry[];
  myRank: number | null;
  myEntry: LeaderboardEntry | null;
  total: number;
}> {
  try {
    const userId = getOrCreateUserId();
    const res = await fetch(`${API_BASE}/leaderboard?userId=${userId}`);
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch {
    return { entries: [], myRank: null, myEntry: null, total: 0 };
  }
}

/** 获取或创建匿名用户 ID（localStorage） */
function getOrCreateUserId(): string {
  const key = "waimai-quiz-user-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export { getOrCreateUserId };
