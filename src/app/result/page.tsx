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

  if (answers.length === 0) return null;

  return (
    <div className="min-h-screen bg-brand flex flex-col px-4 pt-4 pb-4">
      {/* Score header */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center bg-black/10 px-3 py-1 rounded-full mb-2">
          <span className="text-xs font-medium text-title">挑战完成</span>
        </div>
        <div className="text-[48px] font-black text-title leading-none">{score}</div>
        <p className="text-xs text-title/60 mt-0.5">满分 100</p>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Rank card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">{level.emoji}</span>
            <span className="text-lg font-black text-title">{level.title}</span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">{level.description}</p>
          <div className="mt-3 pt-3 border-t border-border flex justify-center gap-6">
            <div className="text-center">
              <div className="text-lg font-black text-title">{correct}</div>
              <div className="text-[10px] text-secondary">答对</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-title">{answers.length - correct}</div>
              <div className="text-[10px] text-secondary">答错</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-title">{answers.length}</div>
              <div className="text-[10px] text-secondary">总题</div>
            </div>
          </div>
        </div>

        {/* Store view */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <StoreView storeState={storeState} compact />
        </div>

        {/* Tip */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">💡</span>
            <p className="text-xs font-bold text-title">经营建议</p>
          </div>
          <p className="text-[11px] text-secondary leading-relaxed">
            分数只是结果，真正值钱的是你看懂了哪些经营问题。持续学习才是最好的经营策略。
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3">
        <button
          onClick={() => router.push("/reward")}
          className="w-full py-3.5 bg-brand-dark text-title text-base font-black rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-black/10"
        >
          领取你的经营福利
        </button>
      </div>
    </div>
  );
}
