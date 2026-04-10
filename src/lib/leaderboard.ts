// 排行榜 — 服务端存储（/api/leaderboard）
import { LeaderboardEntry, EndingType, PlayerTag } from "./types";

const API = "/api/leaderboard";

// 本地缓存，减少重复请求
let _cache: LeaderboardEntry[] = [];
let _cacheTime = 0;
const CACHE_TTL = 10_000; // 10秒缓存

/** 从服务端拉排行榜 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const now = Date.now();
  if (_cache.length > 0 && now - _cacheTime < CACHE_TTL) {
    return _cache;
  }
  try {
    const res = await fetch(API);
    if (!res.ok) return _cache;
    const data = await res.json();
    const entries: LeaderboardEntry[] = (data.entries || []).map((e: any) => ({
      id: e.id || e.userId || "",
      displayName: e.displayName || "???",
      profit: e.bestScore || e.profit || 0,
      finalCash: e.finalCash || 0,
      daysSurvived: e.bestCorrectCount || e.daysSurvived || 7,
      ending: (e.ending || e.highestTier || "survive") as EndingType,
      tag: (e.tag || "balanced_master") as PlayerTag,
      createdAt: e.createdAt || 0,
    }));
    // 按利润降序排
    entries.sort((a, b) => b.profit - a.profit);
    _cache = entries.slice(0, 100);
    _cacheTime = now;
    return _cache;
  } catch {
    return _cache;
  }
}

/** 同步版（用缓存，给首页快速渲染用） */
export function getLeaderboard(): LeaderboardEntry[] {
  // 触发一次异步刷新
  fetchLeaderboard();
  return _cache;
}

/** 提交成绩到服务端 */
export async function submitEntry(
  partial: Omit<LeaderboardEntry, "id" | "createdAt">
): Promise<{ rank: number | null }> {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        displayName: partial.displayName,
        bestScore: partial.profit,
        bestCorrectCount: partial.daysSurvived,
        highestTier: partial.ending,
        // 额外字段供后端存储
        finalCash: partial.finalCash,
        daysSurvived: partial.daysSurvived,
        ending: partial.ending,
        tag: partial.tag,
        profit: partial.profit,
      }),
    });
    if (!res.ok) return { rank: null };
    const data = await res.json();
    // 清缓存，下次拉新数据
    _cacheTime = 0;
    return { rank: data.rank ?? null };
  } catch {
    return { rank: null };
  }
}

/** 预测排名（用缓存数据估算） */
export function predictRank(profit: number, daysSurvived: number): number | null {
  const entries = _cache;
  let rank = 1;
  for (const e of entries) {
    if (e.profit > profit || (e.profit === profit && e.daysSurvived > daysSurvived)) {
      rank++;
    } else {
      break;
    }
  }
  return rank <= 100 ? rank : null;
}

/** 是否能进 Top 100 */
export function canEnterLeaderboard(profit: number, _daysSurvived: number): boolean {
  // 只要完成了游戏（不管赚还是亏）都可以上榜
  return true;
}

export function clearLeaderboard() {
  _cache = [];
  _cacheTime = 0;
}

export type { LeaderboardEntry, EndingType, PlayerTag };
