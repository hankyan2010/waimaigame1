"use client";

import { UpgradeOption, UpgradeCategory, Question } from "@/lib/types";

interface UpgradeModalProps {
  choices: UpgradeOption[];
  onSelect: (category: UpgradeCategory) => void;
  feedbackText: string;
  upgradeTip: string;
  question: Question | null;
  selectedLabel: string;
  showFeedback: boolean;
  onDismissFeedback: () => void;
}

export function UpgradeModal({
  choices,
  onSelect,
  feedbackText,
  upgradeTip,
  question,
  selectedLabel,
  showFeedback,
  onDismissFeedback,
}: UpgradeModalProps) {
  const icons: Record<UpgradeCategory, string> = {
    storefront: "🏪",
    menu: "📋",
    kitchen: "👨‍🍳",
    traffic: "🚀",
    reputation: "⭐",
    member: "💳",
  };

  // Phase 2: After selecting upgrade - show feedback + tip
  if (showFeedback) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-8 animate-slide-up">
          <div className="text-center mb-4">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="text-3xl mb-2">✨</div>
            <p className="text-lg font-bold text-title">{feedbackText}</p>
          </div>

          {/* Knowledge tip */}
          <div className="bg-brand/10 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-2">
              <span className="text-base shrink-0">💡</span>
              <div>
                <p className="text-xs font-bold text-title mb-1">经营小贴士</p>
                <p className="text-sm text-body leading-relaxed">{upgradeTip}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onDismissFeedback}
            className="w-full py-3.5 bg-brand text-title font-bold rounded-xl active:scale-[0.98] transition-transform"
          >
            继续答题
          </button>
        </div>
      </div>
    );
  }

  // Phase 1: Show correct answer explanation + upgrade choices
  const correctOption = question?.options.find((o) => o.isCorrect);
  const selected = question?.options.find((o) => o.label === selectedLabel);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-8 animate-slide-up">
        <div className="text-center mb-4">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <span>✓</span>
            <span>答对了！+10分</span>
          </div>
        </div>

        {/* Explanation */}
        {question && (
          <div className="bg-success/5 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-success text-sm shrink-0">正确答案：</span>
              <span className="text-sm text-body font-medium">
                {correctOption?.label}. {correctOption?.text}
              </span>
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Upgrade choices */}
        <p className="text-sm font-bold text-title mb-3 text-center">
          选择一个方向升级你的店铺
        </p>
        <div className="flex flex-col gap-2.5">
          {choices.map((choice) => (
            <button
              key={choice.category}
              onClick={() => onSelect(choice.category)}
              className="w-full flex items-center gap-4 p-4 bg-bg rounded-xl border border-border active:scale-[0.98] active:border-brand transition-all duration-200 text-left"
            >
              <span className="text-2xl shrink-0">
                {icons[choice.category]}
              </span>
              <div className="flex-1">
                <p className="font-bold text-title text-[15px]">
                  {choice.title}
                </p>
                <p className="text-sm text-secondary mt-0.5">
                  {choice.description}
                </p>
              </div>
              <span className="text-brand text-lg">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
