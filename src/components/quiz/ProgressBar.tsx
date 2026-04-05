"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-title font-bold">
          第 {current + 1}/{total} 题
        </span>
        <span className="text-sm text-title/60">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-title rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
