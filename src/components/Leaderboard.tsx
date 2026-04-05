"use client";

import { useEffect, useState } from "react";
import { LeaderboardEntry } from "@/lib/types";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { TIER_MAP } from "@/lib/config";

interface LeaderboardProps {
  limit?: number; // 默认显示全部 100，传 5 或 10 显示精简版
  showMyRank?: boolean;
}

export function Leaderboard({ limit, showMyRank = true }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setEntries(data.entries);
      setMyRank(data.myRank);
      setMyEntry(data.myEntry);
      setTotal(data.total);
      setLoading(false);
    });
  }, []);

  const displayEntries = limit ? entries.slice(0, limit) : entries;
  const isCompact = !!limit;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p className="text-xs text-secondary">加载排行榜...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p className="text-xs text-secondary">暂无排行数据，快来成为第一名！</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${isCompact ? "" : ""}`}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="text-sm">🏆</span>
        <p className="text-xs font-bold text-title">老板排行榜</p>
        {isCompact && (
          <span className="text-[10px] text-secondary ml-auto">TOP {limit}</span>
        )}
        {!isCompact && (
          <span className="text-[10px] text-secondary ml-auto">共 {total} 位老板参与</span>
        )}
      </div>

      {/* Table */}
      <div className={isCompact ? "" : "max-h-[400px] overflow-y-auto"}>
        {displayEntries.map((entry, idx) => {
          const rank = idx + 1;
          const tierInfo = TIER_MAP[entry.highestTier] || TIER_MAP.bronze3;
          const isTop3 = rank <= 3;
          const medals = ["🥇", "🥈", "🥉"];

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                isTop3 ? "bg-brand/5" : idx % 2 === 0 ? "bg-bg/50" : ""
              }`}
            >
              {/* Rank */}
              <div className="w-7 text-center shrink-0">
                {isTop3 ? (
                  <span className="text-base">{medals[rank - 1]}</span>
                ) : (
                  <span className="text-xs font-bold text-secondary">{rank}</span>
                )}
              </div>

              {/* Name + tier */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-title truncate">
                  {entry.displayName}
                </p>
                <p className="text-[10px] text-secondary">
                  {tierInfo.emoji} {tierInfo.label}
                </p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-title">{entry.bestScore}</p>
                <p className="text-[10px] text-secondary">分</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* My rank */}
      {showMyRank && myEntry && myRank && (
        <div className="border-t border-border px-4 py-2.5 bg-brand/10 flex items-center gap-3">
          <div className="w-7 text-center shrink-0">
            <span className="text-xs font-bold text-brand-dark">{myRank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-title truncate">
              {myEntry.displayName}
              <span className="text-[10px] text-secondary ml-1">（我）</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-black text-title">{myEntry.bestScore}</p>
            <p className="text-[10px] text-secondary">分</p>
          </div>
        </div>
      )}
    </div>
  );
}
