"use client";

import { useRef, useEffect, useState } from "react";
import { StoreState } from "@/lib/types";
import { StoreView } from "@/components/upgrade/StoreView";

interface SharePosterProps {
  score: number;
  rank: string;
  storeLevel: number;
  storeState: StoreState;
  onClose: () => void;
  onConfirmShared: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  storefront: "门头",
  menu: "菜单",
  kitchen: "后厨",
  traffic: "流量",
  reputation: "口碑",
  member: "会员",
};

export function SharePoster({ score, rank, storeLevel, storeState, onClose, onConfirmShared }: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    // Wait a frame for SVG to render
    const timer = setTimeout(() => renderPoster(), 100);
    return () => clearTimeout(timer);
  }, [score, rank, storeLevel, storeState]);

  async function renderPoster() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 640;
    const h = 1100;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#FFD100");
    grad.addColorStop(0.5, "#FFB800");
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
    roundRect(ctx, 220, 50, 200, 36, 18);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("外卖经营知识挑战", w / 2, 74);

    // Main title
    ctx.fillStyle = "#111111";
    ctx.font = "900 36px sans-serif";
    ctx.fillText("我的挑战成绩", w / 2, 130);

    // White card area
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 40, 160, w - 80, 280, 24);
    ctx.fill();

    // Score circle
    ctx.fillStyle = "#FFD100";
    ctx.beginPath();
    ctx.arc(w / 2, 260, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111111";
    ctx.font = "900 44px sans-serif";
    ctx.fillText(`${score}`, w / 2, 275);
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("分", w / 2, 300);

    // Rank
    ctx.fillStyle = "#111111";
    ctx.font = "900 24px sans-serif";
    ctx.fillText(rank, w / 2, 360);

    // Store level
    ctx.fillStyle = "#666666";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`店铺等级 Lv.${storeLevel}`, w / 2, 400);

    // === Store visualization ===
    // Try to capture SVG as image
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (svgEl) {
      try {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Draw store view in a white card
            ctx.fillStyle = "#FFFFFF";
            roundRect(ctx, 40, 460, w - 80, 260, 24);
            ctx.fill();

            // Draw SVG image centered
            const imgW = 400;
            const imgH = 200;
            ctx.drawImage(img, (w - imgW) / 2, 480, imgW, imgH);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      } catch {
        // SVG capture failed, draw ability bars instead
        drawAbilityBars(ctx, w, 480, storeState);
      }
    } else {
      drawAbilityBars(ctx, w, 480, storeState);
    }

    // Store ability label
    ctx.fillStyle = "#111111";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("我的店铺能力", w / 2, 710);

    // Ability bars below store view
    drawAbilityBars(ctx, w, 730, storeState);

    // Bottom area
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    roundRect(ctx, 40, 920, w - 80, 150, 24);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("长按保存图片，分享到朋友圈", w / 2, 970);

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("分享后可获得额外一次答题机会", w / 2, 1000);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px sans-serif";
    ctx.fillText("你能超过我吗？来试试！", w / 2, 1040);

    setImageUrl(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-4 max-w-[340px] w-full animate-slide-up max-h-[90vh] overflow-y-auto">
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden StoreView for SVG capture */}
        <div ref={svgContainerRef} className="absolute -left-[9999px] w-[400px] h-[280px]">
          <StoreView storeState={storeState} />
        </div>

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

function drawAbilityBars(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  startY: number,
  storeState: StoreState
) {
  const categories = Object.entries(CATEGORY_LABELS);
  const barW = 280;
  const barH = 14;
  const startX = (canvasW - barW - 80) / 2 + 80;
  const gap = 28;

  categories.forEach(([key, label], i) => {
    const y = startY + i * gap;
    const val = storeState[key as keyof StoreState];

    // Label
    ctx.fillStyle = "#666666";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(label, startX - 12, y + 11);

    // Background bar
    ctx.fillStyle = "#EAEAEA";
    roundRect(ctx, startX, y, barW, barH, 7);
    ctx.fill();

    // Fill bar
    if (val > 0) {
      const fillW = (val / 10) * barW;
      ctx.fillStyle = "#FFD100";
      roundRect(ctx, startX, y, Math.max(fillW, 14), barH, 7);
      ctx.fill();
    }

    // Value text
    ctx.fillStyle = "#333333";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${val}/10`, startX + barW + 8, y + 11);
  });

  ctx.textAlign = "center";
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
