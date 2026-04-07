// Generate D-style "成就晒值" share cover for WeChat sharing.
// Run: node scripts/gen-share-cover.js
// Output:
//   public/share-cover.png         800x640 (5:4) — for 单聊卡片
//   public/share-cover-square.png  640x640        — for 朋友圈卡片
//
// Strategy: build the layout as SVG, rasterize with sharp.
// We avoid the `canvas` package because it needs cairo/pango system libs.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Meituan brand
const YELLOW = "#FFD100";
const YELLOW_DARK = "#E6BC00";
const INK = "#111111";
const SECONDARY = "#6B7280";

// Use system CJK sans-serif. Whoever runs this script needs CJK fonts;
// the sandbox usually has Noto Sans CJK SC.
const FONT_STACK = "PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif";

function svg(width, height) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${YELLOW}"/>
      <stop offset="100%" stop-color="${YELLOW_DARK}"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.12"/>
    </filter>
    <style>
      .ink { fill: ${INK}; }
      .secondary { fill: ${SECONDARY}; }
      .label { font-family: ${FONT_STACK}; font-weight: 700; }
      .num { font-family: ${FONT_STACK}; font-weight: 900; letter-spacing: -2px; }
      .body { font-family: ${FONT_STACK}; font-weight: 500; }
    </style>
  </defs>

  <!-- Yellow gradient background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Decorative coins (subtle) -->
  <circle cx="${width - 60}" cy="60" r="80" fill="#FFFFFF" fill-opacity="0.10"/>
  <circle cx="60" cy="${height - 60}" r="60" fill="#FFFFFF" fill-opacity="0.10"/>

  <!-- Top tag chip -->
  <g transform="translate(${width / 2 - 110}, 38)">
    <rect width="220" height="36" rx="18" fill="#000" fill-opacity="0.10"/>
    <text x="110" y="24" text-anchor="middle" class="label ink" font-size="18">外卖老板生存模拟器</text>
  </g>

  <!-- White result card -->
  <g filter="url(#cardShadow)">
    <rect x="60" y="100" width="${width - 120}" height="${height - 220}" rx="28" fill="#FFFFFF"/>
  </g>

  <!-- Card content -->
  <text x="${width / 2}" y="160" text-anchor="middle" class="label secondary" font-size="20">7天净利润</text>

  <!-- Big number row (placeholder; live numbers come from copy text) -->
  <g transform="translate(${width / 2}, 270)">
    <text text-anchor="middle" class="num ink" font-size="120">+¥??,???</text>
  </g>

  <!-- Sub-row of stats -->
  <g transform="translate(${width / 2}, 360)">
    <text text-anchor="middle" class="body secondary" font-size="22">存活 ? 天 · 段位待解锁 · 1 万本金</text>
  </g>

  <!-- Divider -->
  <line x1="120" y1="400" x2="${width - 120}" y2="400" stroke="#EEEEEE" stroke-width="2"/>

  <!-- CTA pill -->
  <g transform="translate(${width / 2 - 180}, 430)">
    <rect width="360" height="60" rx="30" fill="${YELLOW}"/>
    <text x="180" y="40" text-anchor="middle" class="label ink" font-size="24">点开揭晓你的 7 天战绩 →</text>
  </g>

  <!-- Bottom watermark -->
  <text x="${width / 2}" y="${height - 28}" text-anchor="middle" class="body ink" font-size="18" fill-opacity="0.65">100 道经营决策 · 拆解入店转化 · 下单转化</text>
</svg>`;
}

async function build(width, height, outFile) {
  const svgBuf = Buffer.from(svg(width, height));
  await sharp(svgBuf, { density: 144 })
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  const stat = fs.statSync(outFile);
  console.log(`wrote ${outFile}  ${(stat.size / 1024).toFixed(1)}KB  ${width}x${height}`);
}

(async () => {
  const publicDir = path.join(__dirname, "..", "public");
  await build(800, 640, path.join(publicDir, "share-cover.png"));
  await build(640, 640, path.join(publicDir, "share-cover-square.png"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
