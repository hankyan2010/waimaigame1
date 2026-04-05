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

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();

  useEffect(() => {
    if (store.phase === "home" || store.questions.length === 0) {
      store.startGame(questions);
    }
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
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Yellow header area */}
      <div className="bg-brand pt-5 pb-6 px-5 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full" />
          <div className="absolute top-16 -left-8 w-20 h-20 bg-white rounded-full" />
        </div>

        <div className="relative z-10">
          {/* Progress */}
          <ProgressBar current={store.currentIndex} total={store.questions.length} />

          {/* Score summary */}
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-title/70">
            <span>
              答对{" "}
              <span className="font-bold text-title">
                {correctCount}
              </span>{" "}
              题
            </span>
            <span className="w-px h-3 bg-title/20" />
            <span>
              得分{" "}
              <span className="font-bold text-title">
                {currentScore}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Store view */}
      <div className="px-4 -mt-4 relative z-10">
        <StoreView storeState={store.storeState} compact />
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-3">
        <QuestionCard
          key={question.id}
          question={question}
          onSubmit={store.submitAnswer}
        />
      </div>

      {/* Upgrade modal (correct answer) */}
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

      {/* Wrong answer modal */}
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
