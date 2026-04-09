"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useGameStore } from "@/lib/store";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG } from "@/lib/config";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";
const SITE_BASE = `https://waimaiketang.com${BASE_PATH}/`;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PosterModal({ open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const store = useGameStore();

  useEffect(() => {
    if (!open) return;
    setError("");
    setImgUrl("");
    setGenerating(true);

    // 确保有 playerId
    const playerId = store.playerId || store.ensurePlayerId();
    const inviteUrl = `${SITE_BASE}?invite=${encodeURIComponent(playerId)}`;

    const canvas = canvasRef.current;
    if (!canvas) {
      setError("海报容器未就绪");
      setGenerating(false);
      return;
    }

    generatePoster(canvas, {
      finalCash: store.state.cash,
      daysSurvived: store.state.day,
      ending: store.endingType,
      playerTag: store.playerTag,
      inviteUrl,
    })
      .then((url) => {
        setImgUrl(url);
        setGenerating(false);
      })
      .catch((e) => {
        setError(e?.message || "生成失败");
        setGenerating(false);
      });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-4 max-w-sm w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-center mb-2 text-title">
          长按图片保存 / 发送给朋友
        </p>
        <canvas ref={canvasRef} className="hidden" />

        {generating && (
          <div className="aspect-[3/5] bg-gray-100 rounded-lg flex items-center justify-center text-xs text-secondary">
            正在生成海报...
          </div>
        )}

        {error && (
          <div className="aspect-[3/5] bg-red-50 rounded-lg flex items-center justify-center text-xs text-red-600 p-4 text-center">
            {error}
          </div>
        )}

        {imgUrl && !generating && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt="挑战海报"
            className="w-full rounded-lg shadow-md"
          />
        )}

        <div className="mt-3 text-[11px] text-secondary text-center leading-relaxed">
          ✓ 保存图片即可获得 1 次额外挑战
          <br />
          ✓ 每个朋友扫你的码也帮你 +1 次（最多 +{store.inviteCap} 次）
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-gray-300 text-secondary rounded-lg"
          >
            关闭
          </button>
          <button
            onClick={() => {
              store.markSharedForExtraPlay();
              onClose();
            }}
            disabled={generating || !!error}
            className="flex-1 py-2.5 text-sm font-bold bg-brand text-title rounded-lg disabled:opacity-50"
          >
            我已保存 +1次
          </button>
        </div>
      </div>
    </div>
  );
}

interface PosterOpts {
  finalCash: number;
  daysSurvived: number;
  ending: string | null;
  playerTag: string | null;
  inviteUrl: string;
}

async function generatePoster(
  canvas: HTMLCanvasElement,
  opts: PosterOpts
): Promise<string> {
  const W = 750;
  const H = 1334;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  // 背景渐变（美团黄）
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FFD000");
  bg.addColorStop(1, "#FFC107");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部小标签胶囊
  const tagText = "经营模拟挑战赛";
  ctx.font = "28px -apple-system, sans-serif";
  const tagW = ctx.measureText(tagText).width + 60;
  const tagX = (W - tagW) / 2;
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  roundRect(ctx, tagX, 80, tagW, 50, 25);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, W / 2, 105);

  // 主标题
  ctx.fillStyle = "#000";
  ctx.font = "bold 64px -apple-system, sans-serif";
  ctx.fillText("外卖老板", W / 2, 200);
  ctx.font = "bold 92px -apple-system, sans-serif";
  ctx.fillText("7 天生存挑战", W / 2, 300);

  // 战绩卡（白底圆角）
  const cardX = 60;
  const cardY = 380;
  const cardW = W - 120;
  const cardH = 320;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();

  // 战绩卡内容
  ctx.fillStyle = "#999";
  ctx.font = "26px -apple-system, sans-serif";
  ctx.fillText("我的最终战绩", W / 2, cardY + 50);

  // 大数字 - 现金
  const isBankrupt = opts.ending === "bankrupt";
  ctx.fillStyle = isBankrupt ? "#E53935" : "#000";
  ctx.font = "bold 96px -apple-system, sans-serif";
  const cashText = `¥${opts.finalCash.toLocaleString()}`;
  ctx.fillText(cashText, W / 2, cardY + 145);

  // 盈亏标签
  const profit = opts.finalCash - GAME_CONFIG.initialCash;
  ctx.font = "26px -apple-system, sans-serif";
  ctx.fillStyle = profit >= 0 ? "#2E7D32" : "#E53935";
  const profitText = profit >= 0 ? `7天净赚 ¥${profit}` : `7天亏损 ¥${Math.abs(profit)}`;
  ctx.fillText(profitText, W / 2, cardY + 195);

  // 段位
  const ending = opts.ending ? ENDING_INFO[opts.ending as keyof typeof ENDING_INFO] : null;
  const tag = opts.playerTag ? TAG_INFO[opts.playerTag as keyof typeof TAG_INFO] : null;
  ctx.fillStyle = "#333";
  ctx.font = "bold 32px -apple-system, sans-serif";
  if (ending) {
    ctx.fillText(`${ending.emoji} ${ending.title}`, W / 2, cardY + 260);
  }
  if (tag) {
    ctx.fillStyle = "#666";
    ctx.font = "22px -apple-system, sans-serif";
    ctx.fillText(`【${tag.label}】`, W / 2, cardY + 295);
  }

  // 二维码区
  const qrSize = 260;
  const qrX = (W - qrSize) / 2;
  const qrY = 760;

  // 二维码白底卡片
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 20);
  ctx.fill();

  // 生成二维码图
  const qrDataUrl = await QRCode.toDataURL(opts.inviteUrl, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 二维码下方文案
  ctx.fillStyle = "#000";
  ctx.font = "bold 36px -apple-system, sans-serif";
  ctx.fillText("扫码也来挑战", W / 2, qrY + qrSize + 70);

  ctx.fillStyle = "#444";
  ctx.font = "24px -apple-system, sans-serif";
  ctx.fillText("每人扫一次 都能给我加 1 次挑战机会", W / 2, qrY + qrSize + 110);

  // 底部品牌
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.font = "20px -apple-system, sans-serif";
  ctx.fillText("waimaiketang.com", W / 2, H - 50);

  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
