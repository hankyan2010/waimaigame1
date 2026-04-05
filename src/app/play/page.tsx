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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-secondary">加载中...</div>
      </div>
    );
  }

  const lastAnswer = store.answers.length > 0 ? store.answers[store.answers.length - 1] : null;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-card px-5 pt-12 pb-4 shadow-sm">
        <ProgressBar current={store.currentIndex} total={store.questions.length} />
      </div>

      {/* Store view */}
      <div className="px-4 pt-3">
        <StoreView storeState={store.storeState} compact />
      </div>

      {/* Question */}
      <div className="flex-1 px-4 py-4">
        <QuestionCard
          key={question.id}
          question={question}
          onSubmit={store.submitAnswer}
        />
      </div>

      {/* Score indicator */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center gap-4 text-sm text-secondary">
          <span>
            已答对{" "}
            <span className="font-bold text-success">
              {store.answers.filter((a) => a.isCorrect).length}
            </span>{" "}
            题
          </span>
          <span className="w-px h-3 bg-border" />
          <span>
            当前得分{" "}
            <span className="font-bold text-title">
              {store.answers.reduce((s, a) => s + a.earnedScore, 0)}
            </span>
          </span>
        </div>
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
