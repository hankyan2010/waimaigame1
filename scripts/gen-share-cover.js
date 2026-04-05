// Generate share cover image for WeChat sharing
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const w = 600, h = 600;
const canvas = createCanvas(w, h);
const ctx = canvas.getContext("2d");

// Background - Meituan yellow
ctx.fillStyle = "#FFD100";
ctx.fillRect(0, 0, w, h);

// White card
roundRect(ctx, 40, 40, w - 80, h - 80, 32);
ctx.fillStyle = "#FFFFFF";
ctx.fill();

// Title
ctx.fillStyle = "#111111";
ctx.font = "bold 36px sans-serif";
ctx.textAlign = "center";
ctx.fillText("答题领经营大礼包", w / 2, 120);

// Divider
ctx.strokeStyle = "#EAEAEA";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(80, 150);
ctx.lineTo(w - 80, 150);
ctx.stroke();

// Items
const items = [
  { emoji: "📊", text: "经营诊断报告" },
  { emoji: "📖", text: "实战攻略手册" },
  { emoji: "🎯", text: "专属运营方案" },
];

items.forEach((item, i) => {
  const y = 200 + i * 80;

  // Emoji circle
  ctx.fillStyle = "#FFF8E1";
  ctx.beginPath();
  ctx.arc(130, y, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(item.emoji, 130, y + 10);

  // Text
  ctx.fillStyle = "#333333";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(item.text, 180, y + 10);
});

// Bottom CTA
ctx.fillStyle = "#FFD100";
roundRect(ctx, 100, 470, w - 200, 60, 30);
ctx.fill();

ctx.fillStyle = "#111111";
ctx.font = "bold 28px sans-serif";
ctx.textAlign = "center";
ctx.fillText("限时免费领取 →", w / 2, 510);

// Save
const buffer = canvas.toBuffer("image/png");
const outPath = path.join(__dirname, "../public/share-cover.png");
fs.writeFileSync(outPath, buffer);
console.log("Share cover saved to", outPath);

function roundRect(ctx, x, y, w, h, r) {
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
