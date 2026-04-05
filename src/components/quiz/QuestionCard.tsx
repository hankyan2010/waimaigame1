"use client";

import { useState } from "react";
import { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  onSubmit: (label: string) => void;
}

function CarnivalEffect() {
  const colors = ["#FFD100", "#FF9500", "#FFB800", "#16A34A", "#FF6B6B", "#A855F7", "#3B82F6", "#F59E0B"];
  const particles = Array.from({ length: 44 }, (_, i) => {
    const angle = (i / 44) * 360 + Math.random() * 8;
    const distance = 50 + Math.random() * 60;
    const size = 4 + Math.random() * 8;
    const color = colors[i % colors.length];
    const delay = Math.random() * 0.25;
    const spin = 360 + Math.random() * 720;
    const shapeRoll = i % 5;
    const shape = shapeRoll < 2 ? "star" : shapeRoll < 4 ? "dot" : "ribbon";

    return (
      <span
        key={i}
        className={`confetti-${shape === "star" ? "star" : shape === "dot" ? "dot" : "ribbon"}`}
        style={{
          "--angle": `${angle}deg`,
          "--distance": `${distance}px`,
          "--size": `${size}px`,
          "--color": color,
          "--delay": `${delay}s`,
          "--spin": `${spin}deg`,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div className="confetti-container">
      {particles}
      <span className="confetti-ring" />
      <span className="confetti-ring-2" />
      <span className="confetti-emoji">🎉</span>
    </div>
  );
}

function WrongEffect() {
  return (
    <>
      <div className="wrong-cross-container">
        <span className="wrong-cross">✕</span>
      </div>
      <div className="wrong-vignette" />
    </>
  );
}

export function QuestionCard({ question, onSubmit }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [showWrongEffect, setShowWrongEffect] = useState(false);

  const handleSelect = (label: string) => {
    if (locked) return;
    setSelected(label);
    setLocked(true);

    const isCorrect = question.options.find((o) => o.label === label)?.isCorrect;

    if (isCorrect) {
      setShowCorrectEffect(true);
    } else {
      setShowWrongEffect(true);
    }

    setTimeout(() => {
      onSubmit(label);
      setSelected(null);
      setLocked(false);
      setShowCorrectEffect(false);
      setShowWrongEffect(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-3 relative">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-base font-semibold text-title leading-6">
          {question.title}
        </h2>
      </div>

      <div className="flex flex-col gap-2 relative">
        {showCorrectEffect && <CarnivalEffect />}
        {showWrongEffect && <WrongEffect />}

        {question.options.map((opt) => {
          let borderClass = "border-border";
          let bgClass = "bg-white";
          let textClass = "text-body";
          let extraClass = "";

          if (locked && selected === opt.label) {
            if (opt.isCorrect) {
              borderClass = "border-success";
              bgClass = "bg-success/5";
              textClass = "text-success";
              extraClass = "animate-glow-pulse";
            } else {
              borderClass = "border-error";
              bgClass = "bg-error/5";
              textClass = "text-error";
              extraClass = "animate-shake animate-red-flash";
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
