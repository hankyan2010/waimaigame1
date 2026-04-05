"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { questions } from "@/data/questions";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { WrongAnswer } from "@/components/quiz/WrongAnswer";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { StoreView } from "@/components/upgrade/StoreView";
import { track } from "@/lib/track";

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();

  useEffect(() => {
    if (store.phase === "home" || store.questions.length === 0) {
      store.startGame(questions);
    }
    track("start_game");
  }, []);

  useEffect(() => {
    if (store.phase === "result") {
      router.push("/result");
    }
  }, [store.phase, router]);

  const question = store.currentQuestion();

  if (!question) {
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center">
        <div className="text-title/70">加载中...</div>
      </div>
    );
  }

  const correctCount = store.answers.filter((a) => a.isCorrect).length;
  const currentScore = store.answers.reduce((s, a) => s + a.earnedScore, 0);

  return (
    <div className="min-h-screen bg-brand flex flex-col px-4 pt-3 pb-3">
      {/* Progress + score */}
      <div className="mb-2">
        <ProgressBar current={store.currentIndex} total={store.questions.length} />
        <div className="flex items-center justify-center gap-4 mt-1.5 text-xs text-title/70">
          <span>答对 <span className="font-bold text-title">{correctCount}</span> 题</span>
          <span className="w-px h-2.5 bg-title/20" />
          <span>得分 <span className="font-bold text-title">{currentScore}</span></span>
        </div>
      </div>

      {/* Store view - compact */}
      <div className="mb-2">
        <StoreView storeState={store.storeState} compact />
      </div>

      {/* Question */}
      <div className="flex-1 min-h-0">
        <QuestionCard
          key={question.id}
          question={question}
          onSubmit={store.submitAnswer}
        />
      </div>

      {/* Modals */}
      {(store.phase === "upgrade" || store.phase === "upgrade-feedback") && (
        <UpgradeModal
          choices={store.upgradeChoices}
          onSelect={store.selectUpgrade}
          feedbackText={store.lastFeedbackText}
          upgradeTip={store.lastUpgradeTip}
          question={store.lastAnsweredQuestion}
          selectedLabel={store.lastSelectedLabel}
          showFeedback={store.phase === "upgrade-feedback"}
          onDismissFeedback={store.nextQuestion}
        />
      )}

      {store.phase === "answered-wrong" && store.lastAnsweredQuestion && (
        <WrongAnswer
          question={store.lastAnsweredQuestion}
          selectedLabel={store.lastSelectedLabel}
          onNext={store.nextQuestion}
        />
      )}
    </div>
  );
}
