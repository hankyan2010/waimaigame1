"use client";

import { useRef, useEffect, useState } from "react";

interface SharePosterProps {
  score: number;
  rank: string;
  storeLevel: number;
  onClose: () => void;
  onConfirmShared: () => void;
}

export function SharePoster({ score, rank, storeLevel, onClose, onConfirmShared }: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 640;
    const h = 960;
    canvas.width = w;
    canvas.height = h;

    // Background gradient (Meituan yellow)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#FFD100");
    grad.addColorStop(0.6, "#FFB800");
    grad.addColorStop(1, "#FF9500");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative circles
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(520, 80, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, 200, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Top badge
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    roundRect(ctx, 220, 60, 200, 36, 18);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("外卖经营知识挑战", w / 2, 84);

    // Main title
    ctx.fillStyle = "#111111";
    ctx.font = "900 42px sans-serif";
    ctx.fillText("我的挑战成绩", w / 2, 160);

    // White card area
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 40, 200, w - 80, 480, 24);
    ctx.fill();

    // Score circle
    ctx.fillStyle = "#FFD100";
    ctx.beginPath();
    ctx.arc(w / 2, 320, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111111";
    ctx.font = "900 52px sans-serif";
    ctx.fillText(`${score}`, w / 2, 335);
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("分", w / 2, 365);

    // Rank
    ctx.fillStyle = "#111111";
    ctx.font = "900 28px sans-serif";
    ctx.fillText(rank, w / 2, 440);

    // Store level
    ctx.fillStyle = "#666666";
    ctx.font = "16px sans-serif";
    ctx.fillText(`店铺等级 Lv.${storeLevel}`, w / 2, 480);

    // Divider
    ctx.strokeStyle = "#EAEAEA";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 520);
    ctx.lineTo(w - 80, 520);
    ctx.stroke();

    // Challenge text
    ctx.fillStyle = "#333333";
    ctx.font = "18px sans-serif";
    ctx.fillText("你能超过我吗？来试试！", w / 2, 560);

    // URL
    ctx.fillStyle = "#999999";
    ctx.font = "14px sans-serif";
    ctx.fillText("扫码或长按识别开始挑战", w / 2, 640);

    // Bottom area
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    roundRect(ctx, 40, 720, w - 80, 200, 24);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("长按保存图片，分享到朋友圈", w / 2, 780);

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("分享后可获得额外一次答题机会", w / 2, 810);

    // Game URL text
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px sans-serif";
    ctx.fillText("121.36.105.43:18899/waimai-game", w / 2, 890);

    setImageUrl(canvas.toDataURL("image/png"));
  }, [score, rank, storeLevel]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-4 max-w-[340px] w-full animate-slide-up">
        <canvas ref={canvasRef} className="hidden" />

        {imageUrl && (
          <img
            src={imageUrl}
            alt="分享海报"
            className="w-full rounded-xl mb-4"
          />
        )}

        <p className="text-center text-sm text-secondary mb-4">
          长按上方图片保存，分享到朋友圈
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-secondary text-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirmShared}
            className="flex-1 py-3 rounded-xl bg-brand text-title text-sm font-bold active:scale-[0.98] transition-transform"
          >
            我已分享
          </button>
        </div>
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
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
