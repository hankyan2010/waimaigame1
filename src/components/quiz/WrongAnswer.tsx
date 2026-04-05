"use client";

import { Question } from "@/lib/types";

interface WrongAnswerProps {
  question: Question;
  selectedLabel: string;
  onNext: () => void;
}

export function WrongAnswer({ question, selectedLabel, onNext }: WrongAnswerProps) {
  const correctOption = question.options.find((o) => o.isCorrect);
  const selectedOption = question.options.find((o) => o.label === selectedLabel);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-8 animate-slide-up">
        <div className="text-center mb-5">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
          <div className="inline-flex items-center gap-2 bg-error/10 text-error px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <span>✗</span>
            <span>答错了</span>
          </div>
          <p className="text-sm text-secondary">
            继续加油，下一题把分追回来
          </p>
        </div>

        <div className="bg-bg rounded-xl p-4 mb-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-error text-sm shrink-0">你选的：</span>
            <span className="text-sm text-body">
              {selectedLabel}. {selectedOption?.text}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-success text-sm shrink-0">正确答案：</span>
            <span className="text-sm text-body">
              {correctOption?.label}. {correctOption?.text}
            </span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <p className="text-sm text-secondary leading-relaxed">
              {question.explanation}
            </p>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full py-3.5 bg-brand text-title font-bold rounded-xl active:scale-[0.98] transition-transform"
        >
          下一题
        </button>
      </div>
    </div>
  );
}
