"use client";

import { useState } from "react";
import { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  onSubmit: (label: string) => void;
}

function ConfettiEffect() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 60 + Math.random() * 40;
    const size = 4 + Math.random() * 6;
    const colors = ["#FFD100", "#FF9500", "#FFB800", "#16A34A", "#FF6B6B", "#A855F7"];
    const color = colors[i % colors.length];
    const shape = i % 3 === 0 ? "star" : "circle";
    const delay = Math.random() * 0.2;

    return (
      <span
        key={i}
        className={shape === "star" ? "confetti-star" : "confetti-dot"}
        style={{
          "--angle": `${angle}deg`,
          "--distance": `${distance}px`,
          "--size": `${size}px`,
          "--color": color,
          "--delay": `${delay}s`,
        } as React.CSSProperties}
      />
    );
  });

  return <div className="confetti-container">{particles}</div>;
}

function WrongCross() {
  return (
    <div className="wrong-cross-container">
      <span className="wrong-cross">✕</span>
    </div>
  );
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCross, setShowCross] = useState(false);

  const handleSelect = (label: string) => {
    if (locked) return;
    setSelected(label);
    setLocked(true);

    const isCorrect = question.options.find((o) => o.label === label)?.isCorrect;

    if (isCorrect) {
      setShowConfetti(true);
    } else {
      setShowCross(true);
    }

    setTimeout(() => {
      onSubmit(label);
      setSelected(null);
      setLocked(false);
      setShowConfetti(false);
      setShowCross(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-5 relative">
      <div className="bg-card rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-title leading-7">
          {question.title}
        </h2>
      </div>

      <div className="flex flex-col gap-3 relative">
        {showConfetti && <ConfettiEffect />}
        {showCross && <WrongCross />}

        {question.options.map((opt) => {
          let borderClass = "border-border";
          let bgClass = "bg-card";
          let textClass = "text-body";
          let extraClass = "";

          if (locked && selected === opt.label) {
            if (opt.isCorrect) {
              borderClass = "border-success";
              bgClass = "bg-success/5";
              textClass = "text-success";
            } else {
              borderClass = "border-error";
              bgClass = "bg-error/5";
              textClass = "text-error";
              extraClass = "animate-shake";
            }
          } else if (locked && opt.isCorrect) {
            borderClass = "border-success";
            bgClass = "bg-success/5";
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={locked}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${borderClass} ${bgClass} ${extraClass}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0 ${
                    locked && opt.isCorrect
                      ? "bg-success text-white"
                      : locked && selected === opt.label && !opt.isCorrect
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
    </div>
  );
}
