"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import QRCode from "qrcode";

const BASE = "/waimai-game";

export default function RewardPage() {
  const router = useRouter();
  const { answers, resultLevel, totalScore, correctCount, reset } = useGameStore();
  const level = resultLevel();
  const score = totalScore();
  const correct = correctCount();

  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (answers.length === 0) {
      router.push("/");
    }
  }, [answers, router]);

  const generatePoster = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      const w = 750, h = 1334;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#FFD100";
      ctx.fillRect(0, 0, w, h);

      const cardY = 80, cardH = h - 160;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, 40, cardY, w - 80, cardH, 32);
      ctx.fill();

      ctx.fillStyle = "#111111";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("外卖经营挑战赛", w / 2, cardY + 80);
      ctx.fillStyle = "#666666";
      ctx.font = "28px sans-serif";
      ctx.fillText("我的挑战成绩单", w / 2, cardY + 130);

      const circleY = cardY + 280;
      ctx.beginPath();
      ctx.arc(w / 2, circleY, 100, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF8E1";
      ctx.fill();
      ctx.strokeStyle = "#FFD100";
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.fillStyle = "#111111";
      ctx.font = "bold 72px sans-serif";
      ctx.fillText(`${score}`, w / 2, circleY + 25);
      ctx.fillStyle = "#999999";
      ctx.font = "24px sans-serif";
      ctx.fillText("分", w / 2, circleY + 60);

      const badgeY = circleY + 130;
      ctx.fillStyle = "#FFD100";
      roundRect(ctx, w / 2 - 120, badgeY, 240, 56, 28);
      ctx.fill();
      ctx.fillStyle = "#111111";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`${level.emoji} ${level.title}`, w / 2, badgeY + 38);

      const statY = badgeY + 100;
      ctx.fillStyle = "#333333";
      ctx.font = "28px sans-serif";
      ctx.fillText(`答对 ${correct} 题 · 共 ${answers.length} 题`, w / 2, statY);

      ctx.strokeStyle = "#EAEAEA";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, statY + 40);
      ctx.lineTo(w - 100, statY + 40);
      ctx.stroke();

      ctx.fillStyle = "#666666";
      ctx.font = "24px sans-serif";
      const descLines = wrapText(ctx, level.description, w - 200);
      descLines.forEach((line, i) => {
        ctx.fillText(line, w / 2, statY + 90 + i * 36);
      });

      const challengeY = statY + 90 + descLines.length * 36 + 50;
      ctx.fillStyle = "#FF6B35";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("你敢来挑战吗？", w / 2, challengeY);

      const qrSize = 200;
      const qrY = challengeY + 30;
      const quizUrl = `${window.location.origin}${BASE}/`;
      const qrDataUrl = await QRCode.toDataURL(quizUrl, { width: qrSize, margin: 1 });
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.src = qrDataUrl;
      });
      ctx.drawImage(qrImg, w / 2 - qrSize / 2, qrY, qrSize, qrSize);
      ctx.fillStyle = "#999999";
      ctx.font = "22px sans-serif";
      ctx.fillText("扫码开始你的答题挑战", w / 2, qrY + qrSize + 36);

      ctx.fillStyle = "#CCCCCC";
      ctx.font = "20px sans-serif";
      ctx.fillText("外卖经营知识答题挑战", w / 2, h - 100);

      setPosterUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.error("Generate poster failed:", e);
    } finally {
      setGenerating(false);
    }
  }, [score, level, correct, answers.length, generating]);

  if (answers.length === 0) return null;

  const handleReplay = () => {
    reset();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Compact top bar */}
      <div className="bg-brand pt-10 pb-4 px-6 text-center">
        <h1 className="text-lg font-black text-title">
          🎁 经营福利已解锁 · {level.title}
        </h1>
      </div>

      {/* Content - tight spacing */}
      <div className="flex-1 px-4 pt-3 space-y-3">

        {/* Row 1: QR code + reward list side by side */}
        <div className="flex gap-3">
          {/* QR code */}
          <div className="bg-card rounded-2xl p-3 shadow-sm text-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/qrcode.png`}
              alt="扫码加微信"
              className="w-28 h-28 mx-auto rounded-lg"
            />
            <p className="text-[11px] text-secondary mt-1.5 leading-tight">
              扫码加微信<br />备注「答题福利」
            </p>
          </div>

          {/* Reward list */}
          <div className="bg-card rounded-2xl p-3 shadow-sm flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📊</span>
              <p className="text-sm font-bold text-title">实战资料包</p>
            </div>
            <div className="space-y-1.5">
              {[
                "经营核心指标清单",
                "菜单优化实操手册",
                "评价运营SOP",
                "流量投放ROI表",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="text-success text-xs">✓</span>
                  <span className="text-xs text-body">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgency bar */}
        <div className="bg-warning/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-warning text-xs">⏰</span>
          <p className="text-xs text-body">福利名额有限，尽快领取</p>
        </div>

        {/* Share poster section */}
        <div className="bg-card rounded-2xl p-4 shadow-sm text-center">
          {posterUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterUrl}
                alt="分享海报"
                className="w-full max-w-[260px] mx-auto rounded-xl shadow-md mb-3"
              />
              <p className="text-xs text-secondary mb-3">
                长按图片保存到相册，分享到朋友圈
              </p>
              <button onClick={() => setPosterUrl(null)} className="text-xs text-secondary underline">
                关闭海报
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-title mb-1">邀请好友来挑战</p>
              <p className="text-xs text-secondary mb-3">
                生成海报发朋友圈，看看谁的经营水平更高
              </p>
              <button
                onClick={generatePoster}
                disabled={generating}
                className="w-full py-3 bg-brand text-title text-sm font-bold rounded-xl active:scale-[0.98] transition-transform"
              >
                {generating ? "生成中..." : "生成分享海报"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="px-4 pb-5 pt-2">
        <button
          onClick={handleReplay}
          className="w-full py-3 bg-card border border-border text-body text-sm font-bold rounded-xl active:scale-[0.98] transition-transform"
        >
          再来一次挑战
        </button>
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = char;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
