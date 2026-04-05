"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { StoreView } from "@/components/upgrade/StoreView";

export default function ResultPage() {
  const router = useRouter();
  const { phase, answers, storeState, totalScore, correctCount, resultLevel } =
    useGameStore();

  const score = totalScore();
  const correct = correctCount();
  const level = resultLevel();

  useEffect(() => {
    if (phase === "home" && answers.length === 0) {
      router.push("/");
    }
  }, [phase, answers, router]);

  if (answers.length === 0) {
    return null;
  }

  const rankColors: Record<string, { bg: string; text: string; ring: string }> = {
    "青铜掌柜": { bg: "bg-amber-900/10", text: "text-amber-800", ring: "ring-amber-800/20" },
    "白银店长": { bg: "bg-gray-200", text: "text-gray-600", ring: "ring-gray-400/30" },
    "黄金操盘手": { bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-500/30" },
    "王者掌门": { bg: "bg-orange-100", text: "text-orange-600", ring: "ring-orange-500/30" },
  };

  const colors = rankColors[level.title] ?? rankColors["青铜掌柜"];

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Yellow top section */}
      <div className="bg-brand pt-8 pb-14 px-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full mb-3">
            <span className="text-xs font-medium text-title">挑战完成</span>
          </div>

          <div className="text-[56px] font-black text-title leading-none mb-1">
            {score}
          </div>
          <p className="text-sm text-title/60">满分 100</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-6 space-y-3 relative z-10">
        {/* Rank card */}
        <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full ring-2 ${colors.bg} ${colors.text} ${colors.ring} mb-3`}
          >
            <span className="text-xl">{level.emoji}</span>
            <span className="text-lg font-black">{level.title}</span>
          </div>

          <p className="text-sm text-body leading-relaxed mt-3">
            {level.description}
          </p>

          <div className="mt-4 pt-4 border-t border-border flex justify-center gap-8">
            <div className="text-center">
              <div className="text-xl font-black text-title">{correct}</div>
              <div className="text-xs text-secondary mt-0.5">答对题数</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-title">
                {answers.length - correct}
              </div>
              <div className="text-xs text-secondary mt-0.5">答错题数</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black text-title">
                {answers.length}
              </div>
              <div className="text-xs text-secondary mt-0.5">总题数</div>
            </div>
          </div>
        </div>

        {/* Store result */}
        <StoreView storeState={storeState} />

        {/* Commentary */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <p className="text-sm font-bold text-title">经营建议</p>
          </div>
          <p className="text-sm text-secondary leading-relaxed">
            分数只是结果，真正值钱的是你看懂了哪些经营问题。无论段位高低，持续学习才是最好的经营策略。
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          onClick={() => router.push("/reward")}
          className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
        >
          领取你的经营福利
        </button>
      </div>
    </div>
  );
}
