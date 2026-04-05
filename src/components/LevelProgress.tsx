"use client";

import { RankTier } from "@/lib/types";
import { TIER_LIST, TIER_MAP } from "@/lib/config";

interface LevelProgressProps {
  currentTier: RankTier;
  compact?: boolean;
}

const GROUP_COLORS: Record<string, { active: string; done: string; label: string }> = {
  bronze: { active: "bg-amber-600", done: "bg-amber-600/70", label: "青铜" },
  silver: { active: "bg-gray-400", done: "bg-gray-400/70", label: "白银" },
  gold:   { active: "bg-yellow-500", done: "bg-yellow-500/70", label: "黄金" },
  king:   { active: "bg-orange-500", done: "bg-orange-500/70", label: "王者" },
};

export function LevelProgress({ currentTier, compact }: LevelProgressProps) {
  const currentInfo = TIER_MAP[currentTier];
  const currentIdx = currentInfo.index;

  if (compact) {
    // 紧凑版：只显示当前等级 + 进度百分比
    const pct = Math.round(((currentIdx + 1) / TIER_LIST.length) * 100);
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{currentInfo.emoji}</span>
        <span className="text-xs font-bold text-title">{currentInfo.label}</span>
        <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-title rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-title/60">{pct}%</span>
      </div>
    );
  }

  // 完整版：显示所有 12 级
  const groups = ["bronze", "silver", "gold", "king"] as const;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">📊</span>
        <p className="text-xs font-bold text-title">等级进度</p>
        <span className="text-[10px] text-secondary ml-auto">
          {currentInfo.emoji} {currentInfo.label}
        </span>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const tiers = TIER_LIST.filter((t) => t.group === group);
          const colors = GROUP_COLORS[group];

          return (
            <div key={group} className="flex items-center gap-2">
              <span className="text-[10px] text-secondary w-6 text-right shrink-0">
                {colors.label}
              </span>
              <div className="flex gap-1 flex-1">
                {tiers.map((tier) => {
                  const isDone = tier.index < currentIdx;
                  const isCurrent = tier.index === currentIdx;
                  const isFuture = tier.index > currentIdx;

                  return (
                    <div
                      key={tier.id}
                      className={`flex-1 h-5 rounded-md flex items-center justify-center text-[9px] font-bold transition-all ${
                        isCurrent
                          ? `${colors.active} text-white ring-2 ring-title/30 scale-105`
                          : isDone
                          ? `${colors.done} text-white/80`
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      {isCurrent ? "★" : isDone ? "✓" : isFuture ? tier.label.slice(-1) : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
