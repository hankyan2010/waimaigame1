"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { StoreView } from "@/components/upgrade/StoreView";
import { LevelProgress } from "@/components/LevelProgress";
import { DisplayNameInput } from "@/components/DisplayNameInput";
import { Leaderboard } from "@/components/Leaderboard";
import { SharePoster } from "@/components/SharePoster";
import { ShareGuide } from "@/components/ShareGuide";
import { track } from "@/lib/track";
import { submitLeaderboardEntry } from "@/lib/leaderboard";
import { getTierInfo, getNextTier, TIER_MAP } from "@/lib/config";

export default function ResultPage() {
  const router = useRouter();
  const store = useGameStore();

  const {
    phase, answers, storeState, totalScore, correctCount, resultLevel,
    currentTier, lastRoundPassed, lastRoundPromoted, lastRoundPreviousTier,
    nextRoundUnlocked, hasSubmittedDisplayName, displayName, bestScore, bestRank,
    highestTier,
  } = store;

  const score = totalScore();
  const correct = correctCount();
  const level = resultLevel();

  const [showPoster, setShowPoster] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [leaderboardSubmitted, setLeaderboardSubmitted] = useState(false);

  const tierInfo = getTierInfo(currentTier);
  const prevTierInfo = TIER_MAP[lastRoundPreviousTier];
  const nextTier = getNextTier(currentTier);
  const storeLevel = Object.values(storeState).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (phase === "home" && answers.length === 0) {
      router.push("/");
    } else if (answers.length > 0) {
      if (lastRoundPassed) {
        track("round_passed", { score, correctCount: correct, tier: currentTier });
        if (lastRoundPromoted) {
          track("tier_up", { fromTier: lastRoundPreviousTier, toTier: currentTier, score });
        }
        track("next_round_unlocked_by_pass");
      } else {
        track("round_failed", { score, correctCount: correct });
      }
      track("complete_game", { score, correct, rank: level.title, tier: currentTier });
    }
  }, []);

  // 自动提交排行榜
  useEffect(() => {
    if (hasSubmittedDisplayName && !leaderboardSubmitted && answers.length > 0) {
      submitLeaderboardEntry({
        displayName,
        bestScore,
        bestCorrectCount: store.bestCorrectCount,
        highestTier,
      });
      setLeaderboardSubmitted(true);
    }
  }, [hasSubmittedDisplayName, leaderboardSubmitted, answers.length]);

  if (answers.length === 0) return null;

  const handleDisplayNameSubmit = (name: string) => {
    store.setDisplayName(name);
    submitLeaderboardEntry({
      displayName: name,
      bestScore: score > bestScore ? score : bestScore,
      bestCorrectCount: correct > store.bestCorrectCount ? correct : store.bestCorrectCount,
      highestTier: currentTier,
    });
    setLeaderboardSubmitted(true);
    track("display_name_submit");
  };

  const handleShareForNextRound = () => {
    setShowPoster(true);
    track("share_to_unlock_next_round_click");
  };

  const handleShareConfirm = () => {
    store.markSharedForNextRound();
    setShowPoster(false);
    setShowGuide(true);
    track("share_confirm_for_next_round");
    track("next_round_unlocked_by_share");
  };

  const handleNextRound = () => {
    store.reset();
    router.push("/play");
  };

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
            <span className="text-xs font-medium text-title">
              {lastRoundPassed ? "达标晋级" : "挑战完成"}
            </span>
          </div>

          <div className="text-[56px] font-black text-title leading-none mb-1">
            {score}
          </div>
          <p className="text-sm text-title/60">满分 100 · 达标 60 分</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-6 space-y-3 relative z-10">
        {/* 晋级结果卡片 */}
        <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
          {lastRoundPromoted ? (
            <>
              <div className="text-2xl mb-1">🎉</div>
              <p className="text-base font-black text-title mb-1">
                恭喜晋级到 {tierInfo.emoji} {tierInfo.label}
              </p>
              <p className="text-xs text-secondary">
                从 {prevTierInfo.label} 升级成功！
                {nextTier ? `继续冲击 ${nextTier.label}` : "已达最高等级！"}
              </p>
            </>
          ) : lastRoundPassed ? (
            <>
              <div className="text-2xl mb-1">👑</div>
              <p className="text-base font-black text-title mb-1">
                你已达到最高等级 {tierInfo.emoji} {tierInfo.label}
              </p>
              <p className="text-xs text-secondary">
                本轮达标，已免费解锁下一轮挑战
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1">💪</div>
              <p className="text-base font-black text-title mb-1">
                本轮未达到晋级标准
              </p>
              <p className="text-xs text-secondary">
                当前等级 {tierInfo.emoji} {tierInfo.label} · 需要 60 分以上才能晋级
              </p>
            </>
          )}

          {/* 答题统计 */}
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

        {/* 等级进度 */}
        <LevelProgress currentTier={currentTier} />

        {/* 排行榜名称填写 / 已填显示 */}
        {!hasSubmittedDisplayName ? (
          <DisplayNameInput onSubmit={handleDisplayNameSubmit} />
        ) : (
          <DisplayNameInput
            onSubmit={handleDisplayNameSubmit}
            currentName={displayName}
            canEdit={store.displayNameEditCount < 1}
          />
        )}

        {/* 精简排行榜 TOP 5 */}
        <Leaderboard limit={5} />

        {/* 店铺 */}
        <div className="bg-card rounded-2xl p-3 shadow-sm">
          <StoreView storeState={storeState} compact />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        {lastRoundPassed || nextRoundUnlocked ? (
          <div className="space-y-2">
            <button
              onClick={handleNextRound}
              className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
            >
              继续挑战下一轮
            </button>
            <button
              onClick={() => router.push("/reward")}
              className="w-full py-3 bg-card border border-border text-body text-sm font-bold rounded-2xl active:scale-[0.98] transition-transform"
            >
              领取经营福利
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleShareForNextRound}
              className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
            >
              发朋友圈，解锁下一轮
            </button>
            <button
              onClick={() => router.push("/reward")}
              className="w-full py-3 bg-card border border-border text-body text-sm font-bold rounded-2xl active:scale-[0.98] transition-transform"
            >
              先看看经营福利
            </button>
          </div>
        )}
      </div>

      {/* Share poster */}
      {showPoster && (
        <SharePoster
          score={bestScore > score ? bestScore : score}
          rank={bestRank || level.title}
          storeLevel={storeLevel}
          storeState={storeState}
          onClose={() => setShowPoster(false)}
          onConfirmShared={handleShareConfirm}
        />
      )}

      {showGuide && <ShareGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
