"use client";

import { useState } from "react";
import { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  onSubmit: (label: string) => void;
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (label: string) => {
    if (submitted) return;
    setSelected(label);
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);

    // Show correct/incorrect state briefly
    setTimeout(() => {
      onSubmit(selected);
      setSelected(null);
      setSubmitted(false);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-title leading-7">
          {question.title}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {question.options.map((opt) => {
          let borderClass = "border-border";
          let bgClass = "bg-card";
          let textClass = "text-body";

          if (submitted && selected === opt.label) {
            if (opt.isCorrect) {
              borderClass = "border-success";
              bgClass = "bg-success/5";
              textClass = "text-success";
            } else {
              borderClass = "border-error";
              bgClass = "bg-error/5";
              textClass = "text-error";
            }
          } else if (submitted && opt.isCorrect) {
            borderClass = "border-success";
            bgClass = "bg-success/5";
          } else if (selected === opt.label) {
            borderClass = "border-brand";
            bgClass = "bg-brand/5";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${borderClass} ${bgClass}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 ${
                    selected === opt.label && !submitted
                      ? "bg-brand text-title"
                      : submitted && opt.isCorrect
                      ? "bg-success text-white"
                      : submitted && selected === opt.label && !opt.isCorrect
                      ? "bg-error text-white"
                      : "bg-bg text-secondary"
                  }`}
                >
                  {opt.label}
                </span>
                <span className={`text-[15px] leading-6 ${textClass}`}>
                  {opt.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || submitted}
        className={`w-full py-3.5 rounded-xl text-base font-bold transition-all duration-200 ${
          selected && !submitted
            ? "bg-brand text-title active:scale-[0.98] shadow-sm"
            : "bg-border text-secondary cursor-not-allowed"
        }`}
      >
        {submitted ? "判定中..." : "提交答案"}
      </button>
    </div>
  );
}
