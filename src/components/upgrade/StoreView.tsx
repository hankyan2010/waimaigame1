"use client";

import { StoreState } from "@/lib/types";

// ---- Isometric math ----
const TW = 30, TH = 15, CX = 200, CY = 100, ZH = 22;
function ix(gx: number, gy: number) { return CX + (gx - gy) * TW; }
function iy(gx: number, gy: number, gz = 0) { return CY + (gx + gy) * TH - gz * ZH; }
function pt(gx: number, gy: number, gz = 0) { return `${ix(gx, gy)},${iy(gx, gy, gz)}`; }

// Wall helpers
function WallLeft({ y1, z1, y2, z2, fill }: { y1: number; z1: number; y2: number; z2: number; fill: string }) {
  return <polygon points={`${pt(0, y1, z1)} ${pt(0, y2, z1)} ${pt(0, y2, z2)} ${pt(0, y1, z2)}`} fill={fill} />;
}
function WallRight({ x1, z1, x2, z2, fill }: { x1: number; z1: number; x2: number; z2: number; fill: string }) {
  return <polygon points={`${pt(x1, 0, z1)} ${pt(x2, 0, z1)} ${pt(x2, 0, z2)} ${pt(x1, 0, z2)}`} fill={fill} />;
}

// Isometric box with 3 visible faces
function Box({ x, y, w = 1, d = 1, h = 1, top, left, right }: {
  x: number; y: number; w?: number; d?: number; h?: number;
  top: string; left: string; right: string;
}) {
  return (
    <g>
      <polygon points={`${pt(x, y + d)} ${pt(x + w, y + d)} ${pt(x + w, y + d, h)} ${pt(x, y + d, h)}`} fill={left} />
      <polygon points={`${pt(x + w, y)} ${pt(x + w, y + d)} ${pt(x + w, y + d, h)} ${pt(x + w, y, h)}`} fill={right} />
      <polygon points={`${pt(x, y, h)} ${pt(x + w, y, h)} ${pt(x + w, y + d, h)} ${pt(x, y + d, h)}`} fill={top} />
    </g>
  );
}

// ---- Detailed item components ----

/** 大型卡座沙发 */
function BigBooth({ gx, gy, flip }: { gx: number; gy: number; flip?: boolean }) {
  const cx = ix(gx, gy), cy = iy(gx, gy);
  const W = 50, H = 25;
  const dir = flip ? 1 : -1;
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx={W * 0.55} ry={H * 0.4} fill="rgba(0,0,0,0.07)" />
      {/* Seat base */}
      <polygon points={`${cx},${cy - 4} ${cx + W / 2},${cy + H / 2 - 4} ${cx},${cy + H - 4} ${cx - W / 2},${cy + H / 2 - 4}`} fill="#8B1A1A" />
      {/* Seat cushion top */}
      <polygon points={`${cx},${cy - 14} ${cx + W / 2},${cy + H / 2 - 14} ${cx},${cy + H - 14} ${cx - W / 2},${cy + H / 2 - 14}`} fill="#C0392B" />
      {/* Cushion front faces */}
      <polygon points={`${cx - W / 2},${cy + H / 2 - 14} ${cx},${cy + H - 14} ${cx},${cy + H - 4} ${cx - W / 2},${cy + H / 2 - 4}`} fill="#A33025" />
      <polygon points={`${cx},${cy + H - 14} ${cx + W / 2},${cy + H / 2 - 14} ${cx + W / 2},${cy + H / 2 - 4} ${cx},${cy + H - 4}`} fill="#B5342A" />
      {/* Back rest - large curved panel */}
      <path
        d={`M${cx + dir * W / 2},${cy + H / 2 - 14} L${cx},${cy - 14} L${cx},${cy - 40} C${cx + dir * W / 3},${cy - 42} ${cx + dir * W / 2},${cy + H / 4 - 40} ${cx + dir * W / 2},${cy + H / 2 - 36} Z`}
        fill="#C0392B"
      />
      <path d={`M${cx},${cy - 14} L${cx},${cy - 40} L${cx - dir * 4},${cy - 41} L${cx - dir * 4},${cy - 15} Z`} fill="#A33025" />
      {/* Tufting buttons */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <circle key={i}
          cx={cx + dir * W * 0.15 * f} cy={cy - 20 - i * 5}
          r="1.5" fill="#A33025"
        />
      ))}
    </g>
  );
}

/** 大型餐桌 with food */
function BigTable({ gx, gy, food }: { gx: number; gy: number; food?: boolean }) {
  const cx = ix(gx, gy), cy = iy(gx, gy);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx="22" ry="10" fill="rgba(0,0,0,0.06)" />
      {/* 4 table legs */}
      {[[-14, -4], [14, -4], [-8, 6], [8, 6]].map(([ox, oy], i) => (
        <line key={i} x1={cx + ox} y1={cy + oy} x2={cx + ox} y2={cy + oy - 20} stroke="#8B6914" strokeWidth="3" strokeLinecap="round" />
      ))}
      {/* Table top - large diamond */}
      <polygon points={`${cx},${cy - 24} ${cx + 24},${cy - 14} ${cx},${cy - 4} ${cx - 24},${cy - 14}`}
        fill="#C4A882" stroke="#A89070" strokeWidth="0.8" />
      {/* Edge thickness */}
      <polygon points={`${cx - 24},${cy - 14} ${cx},${cy - 4} ${cx},${cy - 1} ${cx - 24},${cy - 11}`} fill="#A89070" />
      <polygon points={`${cx},${cy - 4} ${cx + 24},${cy - 14} ${cx + 24},${cy - 11} ${cx},${cy - 1}`} fill="#B09878" />
      {food && <>
        {/* Plate with food */}
        <ellipse cx={cx - 8} cy={cy - 17} rx="9" ry="4.5" fill="#FFF" stroke="#E0E0E0" strokeWidth="0.5" />
        <ellipse cx={cx - 8} cy={cy - 18} rx="6" ry="3" fill="#FF6B35" />
        <ellipse cx={cx - 8} cy={cy - 19} rx="3" ry="1.5" fill="#FF8855" />
        {/* Cup with handle */}
        <rect x={cx + 5} y={cy - 24} width="7" height="7" rx="1.5" fill="#FFF" stroke="#DDD" strokeWidth="0.5" />
        <ellipse cx={cx + 8.5} cy={cy - 24} rx="3.5" ry="1.5" fill="#8B5E3C" />
        <path d={`M${cx + 12},${cy - 22} Q${cx + 16},${cy - 21} ${cx + 12},${cy - 19}`} fill="none" stroke="#DDD" strokeWidth="1" />
        {/* Bowl */}
        <ellipse cx={cx + 2} cy={cy - 15} rx="7" ry="3.5" fill="#FFFDE7" stroke="#E0D8C0" strokeWidth="0.5" />
        <ellipse cx={cx + 2} cy={cy - 16.5} rx="5.5" ry="2.8" fill="#FFD100" />
      </>}
    </g>
  );
}

/** 大型灶台 */
function BigStove({ gx, gy }: { gx: number; gy: number }) {
  return (
    <g>
      <Box x={gx} y={gy} w={2.2} d={1.2} h={1.2} top="#606060" left="#454545" right="#525252" />
      {/* Burners */}
      <ellipse cx={ix(gx + 0.6, gy + 0.6)} cy={iy(gx + 0.6, gy + 0.6, 1.2)} rx="10" ry="5" fill="none" stroke="#FF4444" strokeWidth="2" opacity="0.7" />
      <ellipse cx={ix(gx + 0.6, gy + 0.6)} cy={iy(gx + 0.6, gy + 0.6, 1.2)} rx="5" ry="2.5" fill="none" stroke="#FF6644" strokeWidth="1.5" opacity="0.5" />
      <ellipse cx={ix(gx + 1.6, gy + 0.6)} cy={iy(gx + 1.6, gy + 0.6, 1.2)} rx="10" ry="5" fill="none" stroke="#FF4444" strokeWidth="2" opacity="0.7" />
      {/* Big pot */}
      <ellipse cx={ix(gx + 0.6, gy + 0.6)} cy={iy(gx + 0.6, gy + 0.6, 1.5)} rx="11" ry="5.5" fill="#888" stroke="#777" strokeWidth="0.5" />
      <ellipse cx={ix(gx + 0.6, gy + 0.6)} cy={iy(gx + 0.6, gy + 0.6, 1.7)} rx="8" ry="4" fill="#999" />
      {/* Pan */}
      <ellipse cx={ix(gx + 1.6, gy + 0.6)} cy={iy(gx + 1.6, gy + 0.6, 1.3)} rx="12" ry="6" fill="#555" />
      <ellipse cx={ix(gx + 1.6, gy + 0.6)} cy={iy(gx + 1.6, gy + 0.6, 1.35)} rx="9" ry="4.5" fill="#666" />
      {/* Pan handle */}
      <line x1={ix(gx + 2.1, gy + 0.4)} y1={iy(gx + 2.1, gy + 0.4, 1.35)} x2={ix(gx + 2.6, gy + 0.2)} y2={iy(gx + 2.6, gy + 0.2, 1.4)} stroke="#444" strokeWidth="3" strokeLinecap="round" />
      {/* Knobs on front */}
      {[0.4, 0.9, 1.4, 1.9].map((ox, i) => (
        <circle key={i} cx={ix(gx + ox, gy + 1.2)} cy={iy(gx + ox, gy + 1.2, 0.8)} r="3" fill="#333" stroke="#555" strokeWidth="0.5" />
      ))}
      {/* Steam */}
      <g className="animate-steam-1">
        <ellipse cx={ix(gx + 0.6, gy + 0.5)} cy={iy(gx + 0.6, gy + 0.5, 2.5)} rx="6" ry="3" fill="rgba(255,255,255,0.5)" />
      </g>
      <g className="animate-steam-2">
        <ellipse cx={ix(gx + 0.8, gy + 0.4)} cy={iy(gx + 0.8, gy + 0.4, 3)} rx="5" ry="2.5" fill="rgba(255,255,255,0.3)" />
      </g>
    </g>
  );
}

/** 大型冰箱 */
function BigFridge({ gx, gy }: { gx: number; gy: number }) {
  return (
    <g>
      <Box x={gx} y={gy} w={1.1} d={0.9} h={2.8} top="#E8E8E8" left="#CCCCCC" right="#DDDDDD" />
      {/* Door line */}
      <line x1={ix(gx + 1.1, gy + 0.1)} y1={iy(gx + 1.1, gy + 0.1, 1.5)} x2={ix(gx + 1.1, gy + 0.8)} y2={iy(gx + 1.1, gy + 0.8, 1.5)} stroke="#BBB" strokeWidth="1" />
      {/* Handles */}
      <line x1={ix(gx + 1.1, gy + 0.15)} y1={iy(gx + 1.1, gy + 0.15, 2.3)} x2={ix(gx + 1.1, gy + 0.15)} y2={iy(gx + 1.1, gy + 0.15, 1.8)} stroke="#999" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={ix(gx + 1.1, gy + 0.15)} y1={iy(gx + 1.1, gy + 0.15, 1.3)} x2={ix(gx + 1.1, gy + 0.15)} y2={iy(gx + 1.1, gy + 0.15, 0.8)} stroke="#999" strokeWidth="2.5" strokeLinecap="round" />
      {/* Brand badge */}
      <polygon points={`${pt(gx + 1.1, gy + 0.3, 2.5)} ${pt(gx + 1.1, gy + 0.7, 2.5)} ${pt(gx + 1.1, gy + 0.7, 2.3)} ${pt(gx + 1.1, gy + 0.3, 2.3)}`} fill="#FFD100" />
    </g>
  );
}

/** 大型咖啡机 */
function BigCoffeeMachine({ gx, gy }: { gx: number; gy: number }) {
  const cx = ix(gx, gy), cy = iy(gx, gy);
  return (
    <g>
      {/* Machine body */}
      <rect x={cx - 12} y={cy - 44} width="24" height="40" rx="3" fill="#C0C0C0" stroke="#AAA" strokeWidth="0.8" />
      {/* Top tank */}
      <rect x={cx - 14} y={cy - 50} width="28" height="8" rx="3" fill="#AAA" stroke="#999" strokeWidth="0.5" />
      {/* Pressure gauge - big */}
      <circle cx={cx} cy={cy - 28} r="6" fill="#FFF" stroke="#999" strokeWidth="0.8" />
      <line x1={cx} y1={cy - 28} x2={cx + 3} y2={cy - 25} stroke="#E74C3C" strokeWidth="0.8" />
      <circle cx={cx} cy={cy - 28} r="1" fill="#333" />
      {/* Display */}
      <rect x={cx - 8} y={cy - 40} width="16" height="6" rx="1.5" fill="#333" />
      <circle cx={cx - 4} cy={cy - 37} r="1.5" fill="#2ECC71" />
      <circle cx={cx} cy={cy - 37} r="1.5" fill="#E74C3C" />
      <circle cx={cx + 4} cy={cy - 37} r="1.5" fill="#F1C40F" />
      {/* Group head */}
      <rect x={cx - 5} y={cy - 14} width="10" height="6" rx="1.5" fill="#888" />
      <line x1={cx - 2} y1={cy - 8} x2={cx - 2} y2={cy - 4} stroke="#777" strokeWidth="1.5" />
      <line x1={cx + 2} y1={cy - 8} x2={cx + 2} y2={cy - 4} stroke="#777" strokeWidth="1.5" />
      {/* Steam wand */}
      <path d={`M${cx - 12},${cy - 26} Q${cx - 18},${cy - 18} ${cx - 16},${cy - 12}`} fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" />
      {/* Cup */}
      <rect x={cx - 4} y={cy - 5} width="8" height="6" rx="2" fill="#FFF" stroke="#DDD" strokeWidth="0.5" />
      <ellipse cx={cx} cy={cy - 5} rx="4" ry="1.5" fill="#6F4E37" />
      {/* Drip tray */}
      <rect x={cx - 14} y={cy} width="28" height="3" rx="1.5" fill="#999" />
    </g>
  );
}

/** 大型盆栽 */
function BigPlant({ gx, gy }: { gx: number; gy: number }) {
  const cx = ix(gx, gy), cy = iy(gx, gy);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx="10" ry="5" fill="rgba(0,0,0,0.06)" />
      {/* Pot */}
      <path d={`M${cx - 10},${cy - 2} L${cx - 8},${cy - 16} L${cx + 8},${cy - 16} L${cx + 10},${cy - 2} Z`} fill="#B5651D" stroke="#8B4513" strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy - 16} rx="9" ry="4" fill="#C4722B" />
      <ellipse cx={cx} cy={cy - 16} rx="7" ry="3" fill="#5C4033" />
      {/* Trunk */}
      <path d={`M${cx},${cy - 16} Q${cx - 2},${cy - 26} ${cx + 1},${cy - 32}`} stroke="#5C4033" strokeWidth="3" fill="none" />
      <path d={`M${cx + 1},${cy - 28} Q${cx + 4},${cy - 34} ${cx + 8},${cy - 36}`} stroke="#5C4033" strokeWidth="2" fill="none" />
      {/* Leaves - big and visible */}
      <ellipse cx={cx - 12} cy={cy - 34} rx="10" ry="6" fill="#27AE60" transform={`rotate(-30 ${cx - 12} ${cy - 34})`} />
      <ellipse cx={cx + 12} cy={cy - 38} rx="9" ry="5.5" fill="#2ECC71" transform={`rotate(25 ${cx + 12} ${cy - 38})`} />
      <ellipse cx={cx} cy={cy - 42} rx="8" ry="6" fill="#27AE60" transform={`rotate(-5 ${cx} ${cy - 42})`} />
      <ellipse cx={cx - 8} cy={cy - 44} rx="7" ry="5" fill="#2ECC71" transform={`rotate(-15 ${cx - 8} ${cy - 44})`} />
      <ellipse cx={cx + 8} cy={cy - 42} rx="7" ry="4.5" fill="#229954" transform={`rotate(20 ${cx + 8} ${cy - 42})`} />
      <ellipse cx={cx + 2} cy={cy - 48} rx="6" ry="4" fill="#2ECC71" />
    </g>
  );
}

/** 大型人物 */
function BigPerson({ gx, gy, shirt, hair, chef }: {
  gx: number; gy: number; shirt: string; hair?: string; chef?: boolean;
}) {
  const cx = ix(gx, gy), cy = iy(gx, gy);
  return (
    <g>
      <ellipse cx={cx} cy={cy + 2} rx="7" ry="3.5" fill="rgba(0,0,0,0.08)" />
      {/* Legs */}
      <rect x={cx - 5} y={cy - 12} width="4" height="12" rx="2" fill="#2C3E50" />
      <rect x={cx + 1} y={cy - 12} width="4" height="12" rx="2" fill="#2C3E50" />
      {/* Shoes */}
      <ellipse cx={cx - 3} cy={cy} rx="4" ry="2" fill="#333" />
      <ellipse cx={cx + 3} cy={cy} rx="4" ry="2" fill="#333" />
      {/* Body */}
      <rect x={cx - 7} y={cy - 26} width="14" height="16" rx="3" fill={shirt} />
      {/* Arms */}
      <rect x={cx - 10} y={cy - 25} width="4" height="12" rx="2" fill={shirt} />
      <rect x={cx + 6} y={cy - 25} width="4" height="12" rx="2" fill={shirt} />
      <circle cx={cx - 8} cy={cy - 12} r="2" fill="#FFCCAA" />
      <circle cx={cx + 8} cy={cy - 12} r="2" fill="#FFCCAA" />
      {/* Neck & Head */}
      <rect x={cx - 2} y={cy - 30} width="4" height="5" fill="#FFCCAA" />
      <circle cx={cx} cy={cy - 34} r="7" fill="#FFCCAA" />
      {/* Hair */}
      <path d={`M${cx - 7},${cy - 34} Q${cx - 7},${cy - 42} ${cx},${cy - 43} Q${cx + 7},${cy - 42} ${cx + 7},${cy - 34}`} fill={hair || "#333"} />
      {/* Eyes */}
      <circle cx={cx - 2} cy={cy - 34} r="1.2" fill="#333" />
      <circle cx={cx + 2} cy={cy - 34} r="1.2" fill="#333" />
      {/* Smile */}
      <path d={`M${cx - 2},${cy - 31} Q${cx},${cy - 29.5} ${cx + 2},${cy - 31}`} fill="none" stroke="#C0846A" strokeWidth="0.8" />
      {chef && (
        <g>
          <rect x={cx - 7} y={cy - 47} width="14" height="8" rx="2" fill="white" stroke="#EEE" strokeWidth="0.5" />
          <ellipse cx={cx} cy={cy - 48} rx="8" ry="5" fill="white" />
        </g>
      )}
    </g>
  );
}

/** 外卖骑手 with 电动车 */
function Rider({ gx, gy }: { gx: number; gy: number }) {
  const cx = ix(gx, gy), cy = iy(gx, gy);
  return (
    <g>
      {/* Scooter wheels */}
      <ellipse cx={cx - 10} cy={cy + 2} rx="7" ry="3.5" fill="#444" stroke="#333" strokeWidth="1" />
      <ellipse cx={cx + 10} cy={cy + 2} rx="7" ry="3.5" fill="#444" stroke="#333" strokeWidth="1" />
      {/* Scooter body */}
      <rect x={cx - 8} y={cy - 6} width="16" height="5" rx="2" fill="#666" />
      {/* Rider body */}
      <rect x={cx - 5} y={cy - 22} width="10" height="14" rx="2" fill="#FFD100" />
      {/* Arms */}
      <rect x={cx - 8} y={cy - 18} width="3" height="8" rx="1.5" fill="#FFD100" />
      <rect x={cx + 5} y={cy - 18} width="3" height="8" rx="1.5" fill="#FFD100" />
      {/* Head */}
      <circle cx={cx} cy={cy - 26} r="5" fill="#FFCCAA" />
      {/* Helmet */}
      <path d={`M${cx - 6},${cy - 27} Q${cx - 6},${cy - 34} ${cx},${cy - 34} Q${cx + 6},${cy - 34} ${cx + 6},${cy - 27}`} fill="#FFD100" />
      {/* Delivery box */}
      <rect x={cx - 8} y={cy - 40} width="16" height="14" rx="2" fill="#FFD100" stroke="#E0B800" strokeWidth="1" />
      <text x={cx} y={cy - 31} textAnchor="middle" fill="#333" fontSize="6" fontWeight="bold">外卖</text>
    </g>
  );
}

interface StoreViewProps {
  storeState: StoreState;
  compact?: boolean;
}

export function StoreView({ storeState, compact = false }: StoreViewProps) {
  const sf = storeState.storefront;
  const mn = storeState.menu;
  const kt = storeState.kitchen;
  const tf = storeState.traffic;
  const rp = storeState.reputation;
  const mb = storeState.member;
  const total = sf + mn + kt + tf + rp + mb;

  return (
    <div className={`relative ${compact ? "h-[200px]" : "h-[280px]"} w-full rounded-2xl overflow-hidden shadow-sm`}
      style={{ background: total > 20 ? "linear-gradient(180deg, #FFF8E1 0%, #F0EBE3 40%)" : "linear-gradient(180deg, #EEF0F2 0%, #E8E3DB 40%)" }}
    >
      <svg viewBox="0 0 400 280" className="w-full h-full" preserveAspectRatio="xMidYMid meet">

        {/* ====== FLOOR ====== */}
        {Array.from({ length: 5 }, (_, gy) =>
          Array.from({ length: 5 }, (_, gx) => (
            <polygon key={`f${gx}${gy}`}
              points={`${pt(gx, gy)} ${pt(gx + 1, gy)} ${pt(gx + 1, gy + 1)} ${pt(gx, gy + 1)}`}
              fill={(gx + gy) % 2 === 0 ? "#F0EBE2" : "#D8D3CA"}
              stroke="rgba(0,0,0,0.03)" strokeWidth="0.5"
            />
          ))
        )}

        {/* ====== WALLS ====== */}
        <polygon points={`${pt(0, 0, 4.5)} ${pt(0, 5, 4.5)} ${pt(0, 5)} ${pt(0, 0)}`} fill="#F5F0E8" />
        <polygon points={`${pt(0, 0, 4.5)} ${pt(5, 0, 4.5)} ${pt(5, 0)} ${pt(0, 0)}`} fill="#EBE6DD" />
        <line x1={ix(0, 0)} y1={iy(0, 0)} x2={ix(0, 0)} y2={iy(0, 0, 4.5)} stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
        <line x1={ix(0, 0)} y1={iy(0, 0)} x2={ix(0, 5)} y2={iy(0, 5)} stroke="#C5BFB2" strokeWidth="3" />
        <line x1={ix(0, 0)} y1={iy(0, 0)} x2={ix(5, 0)} y2={iy(5, 0)} stroke="#BBB5A8" strokeWidth="3" />

        {/* ====== WALL ITEMS ====== */}

        {/* Big window on right wall */}
        <WallRight x1={1} z1={1.8} x2={3.5} z2={3.8} fill="#87CEEB" />
        <WallRight x1={1} z1={1.8} x2={3.5} z2={1.85} fill="#8B6914" />
        <WallRight x1={1} z1={3.75} x2={3.5} z2={3.8} fill="#8B6914" />
        <WallRight x1={1} z1={1.8} x2={1.05} z2={3.8} fill="#8B6914" />
        <WallRight x1={3.45} z1={1.8} x2={3.5} z2={3.8} fill="#8B6914" />
        <WallRight x1={2.25} z1={1.8} x2={2.3} z2={3.8} fill="#8B6914" />
        <WallRight x1={1} z1={2.8} x2={3.5} z2={2.85} fill="#8B6914" />
        <WallRight x1={1.2} z1={3} x2={2} z2={3.6} fill="rgba(255,255,255,0.3)" />

        {/* --- MENU: Big chalkboard on left wall --- */}
        {mn >= 1 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <WallLeft y1={0.5} z1={2} y2={2.8} z2={4} fill="#2C2C2C" />
            <WallLeft y1={0.6} z1={2.1} y2={2.7} z2={3.9} fill="#333" />
            {/* Chalk header */}
            <WallLeft y1={0.8} z1={3.5} y2={2.5} z2={3.7} fill="rgba(255,255,255,0.8)" />
            {/* Menu items */}
            <WallLeft y1={0.8} z1={3.1} y2={2.0} z2={3.25} fill="rgba(255,255,255,0.5)" />
            <WallLeft y1={0.8} z1={2.7} y2={1.8} z2={2.85} fill="rgba(255,255,255,0.4)" />
            {mn >= 2 && <WallLeft y1={0.8} z1={2.35} y2={1.6} z2={2.5} fill="rgba(255,255,255,0.4)" />}
          </g>
        )}

        {/* --- MENU: Big food poster --- */}
        {mn >= 3 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <WallLeft y1={3.2} z1={2} y2={4.8} z2={4} fill="#FF6B35" />
            <WallLeft y1={3.3} z1={2.1} y2={4.7} z2={3.9} fill="#FF8C55" />
            {/* Text area */}
            <WallLeft y1={3.5} z1={3.2} y2={4.5} z2={3.6} fill="#FFF" />
            {/* Image area */}
            <WallLeft y1={3.5} z1={2.3} y2={4.5} z2={3} fill="#FFE0CC" />
          </g>
        )}

        {/* --- REPUTATION: Big star rating on right wall --- */}
        {rp >= 1 && (
          <g style={{ transition: "opacity 0.8s" }}>
            {/* Rating board */}
            <WallRight x1={3.8} z1={3} x2={4.8} z2={4.2} fill="#FFF8E1" />
            <text x={ix(4.3, 0)} y={iy(4.3, 0, 3.8)} textAnchor="middle" fill="#FFD100" fontSize="14" fontWeight="bold">
              {"★".repeat(Math.min(rp + 1, 5))}
            </text>
            <text x={ix(4.3, 0)} y={iy(4.3, 0, 3.3)} textAnchor="middle" fill="#333" fontSize="8" fontWeight="bold">
              {rp >= 4 ? "5.0" : rp >= 3 ? "4.8" : rp >= 2 ? "4.5" : "4.0"}
            </text>
          </g>
        )}

        {/* --- REPUTATION: Big certificate --- */}
        {rp >= 3 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <WallRight x1={3.8} z1={1.8} x2={4.8} z2={2.8} fill="#FFFFF0" />
            <WallRight x1={3.85} z1={1.85} x2={4.75} z2={2.75} fill="#FFFDE0" />
            <WallRight x1={4.1} z1={2.1} x2={4.5} z2={2.5} fill="#C0392B" />
          </g>
        )}

        {/* Hanging light */}
        <line x1={ix(2.5, 2.5)} y1={iy(2.5, 2.5, 4.5)} x2={ix(2.5, 2.5)} y2={iy(2.5, 2.5, 3.6)} stroke="#666" strokeWidth="1" />
        <path d={`M${ix(2.5, 2.5) - 8},${iy(2.5, 2.5, 3.5)} Q${ix(2.5, 2.5)},${iy(2.5, 2.5, 3.3)} ${ix(2.5, 2.5) + 8},${iy(2.5, 2.5, 3.5)}`}
          fill={total > 5 ? "#FFFBE6" : "#EEE"} stroke={total > 5 ? "#FFD100" : "#CCC"} strokeWidth="0.8" />
        {total > 10 && <ellipse cx={ix(2.5, 2.5)} cy={iy(2.5, 2.5, 3.4)} rx="14" ry="7" fill="rgba(255,251,230,0.25)" />}

        {/* ====== KITCHEN (back) ====== */}

        {/* --- KITCHEN: Big stove --- */}
        {kt >= 1 && <BigStove gx={0.3} gy={0.3} />}

        {/* --- KITCHEN: Big fridge --- */}
        {kt >= 2 && <BigFridge gx={3.5} gy={0.2} />}

        {/* --- KITCHEN: Prep table --- */}
        {kt >= 3 && <BigTable gx={2.2} gy={0.8} food />}

        {/* ====== COUNTER ====== */}
        <Box x={0.2} y={2} w={4.6} d={0.8} h={1.4}
          top={kt >= 1 ? "#5BA4B5" : "#AAA"}
          left={kt >= 1 ? "#3D7A88" : "#999"}
          right={kt >= 1 ? "#4A8A99" : "#AAA"}
        />
        {/* Yellow trim */}
        <polygon points={`${pt(0.2, 2.8, 1.4)} ${pt(4.8, 2.8, 1.4)} ${pt(4.8, 2.8, 1.5)} ${pt(0.2, 2.8, 1.5)}`} fill="#FFD100" />

        {/* Counter top items */}
        {kt >= 2 && <BigCoffeeMachine gx={3.5} gy={2.15} />}

        {/* Cash register */}
        {kt >= 1 && (
          <g>
            <rect x={ix(4.3, 2.2) - 8} y={iy(4.3, 2.2, 1.4) - 18} width="16" height="12" rx="2" fill="#333" />
            <rect x={ix(4.3, 2.2) - 6} y={iy(4.3, 2.2, 1.4) - 16} width="12" height="7" rx="1" fill="#4A90D9" />
          </g>
        )}

        {/* Food display */}
        {mn >= 2 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <Box x={1.2} y={2.05} w={1.5} d={0.5} h={2.1} top="rgba(200,230,255,0.5)" left="rgba(180,210,240,0.3)" right="rgba(190,220,245,0.3)" />
            <ellipse cx={ix(1.5, 2.3)} cy={iy(1.5, 2.3, 1.5)} rx="6" ry="3" fill="#FF6B35" />
            <ellipse cx={ix(2, 2.3)} cy={iy(2, 2.3, 1.5)} rx="6" ry="3" fill="#FFD100" />
            <ellipse cx={ix(2.4, 2.25)} cy={iy(2.4, 2.25, 1.5)} rx="5" ry="2.5" fill="#E74C3C" />
          </g>
        )}

        {/* ====== DINING ====== */}

        {/* --- TRAFFIC: Big booth + table 1 (left-front) --- */}
        {tf >= 1 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <BigBooth gx={0.2} gy={3.2} />
            <BigTable gx={1.1} gy={3.6} food={tf >= 2} />
          </g>
        )}

        {/* --- TRAFFIC: Table 2 with booth (right-mid) --- */}
        {tf >= 2 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <BigBooth gx={3.8} gy={2.8} flip />
            <BigTable gx={3} gy={3.2} food />
          </g>
        )}

        {/* --- TRAFFIC: Table 3 (center-front) --- */}
        {tf >= 3 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <BigTable gx={2.2} gy={4.5} food />
          </g>
        )}

        {/* --- MEMBER: VIP booth (far left-front) --- */}
        {mb >= 1 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <BigBooth gx={0.1} gy={4.6} />
            <BigTable gx={0.9} gy={5} food={mb >= 2} />
            <rect x={ix(0.2, 4.6) - 10} y={iy(0.2, 4.6) - 52} width="20" height="12" rx="3" fill="#8B5CF6" />
            <text x={ix(0.2, 4.6)} y={iy(0.2, 4.6) - 44} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">VIP</text>
          </g>
        )}

        {/* ====== PEOPLE (sorted by depth: high x+y drawn last) ====== */}
        {kt >= 1 && <BigPerson gx={1.5} gy={1} shirt="white" hair="#333" chef />}
        {kt >= 3 && <BigPerson gx={2.8} gy={0.6} shirt="white" hair="#5C4033" chef />}
        {tf >= 3 && <BigPerson gx={2.8} gy={2.9} shirt="#E74C3C" hair="#1A1A2E" />}
        {tf >= 2 && <BigPerson gx={0.8} gy={3.8} shirt="#4A90D9" hair="#5C4033" />}
        {tf >= 3 && <BigPerson gx={3.3} gy={3.6} shirt="#E67E22" hair="#222" />}
        {tf >= 4 && <BigPerson gx={2.5} gy={4.8} shirt="#9B59B6" hair="#333" />}

        {/* --- STOREFRONT: Big plant (front corners) --- */}
        {sf >= 1 && <BigPlant gx={-0.2} gy={5.3} />}
        {sf >= 2 && <BigPlant gx={5} gy={4.5} />}

        {/* --- TRAFFIC: Delivery rider (outside, right) --- */}
        {tf >= 3 && <Rider gx={5.2} gy={3.8} />}
        {tf >= 5 && <Rider gx={5.6} gy={2.8} />}

        {/* ====== SHOP SIGN ====== */}
        {sf >= 1 && (
          <g style={{ transition: "opacity 0.8s" }}>
            <rect x={ix(2.5, 2.5) - (sf >= 3 ? 60 : 40)} y={iy(0, 0, 4.5) - 26}
              width={sf >= 3 ? 120 : 80} height={sf >= 3 ? 28 : 22} rx="6"
              fill={sf >= 3 ? "#111" : "#555"} stroke={sf >= 4 ? "#FFD100" : "none"} strokeWidth={sf >= 4 ? "2" : "0"} />
            <text x={ix(2.5, 2.5)} y={iy(0, 0, 4.5) - (sf >= 3 ? 8 : 12)}
              textAnchor="middle" fill={sf >= 3 ? "#FFD100" : "#FFF"} fontSize={sf >= 3 ? "14" : "11"} fontWeight="bold">
              {sf >= 4 ? "旺记 · 品质外卖" : sf >= 3 ? "旺记外卖" : sf >= 2 ? "外卖小店" : "小吃"}
            </text>
            {sf >= 4 && (
              <rect x={ix(2.5, 2.5) - 62} y={iy(0, 0, 4.5) - 28} width="124" height="32" rx="8"
                fill="none" stroke="#FFD100" strokeWidth="1.5" opacity="0.3">
                <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        )}

        {/* ====== FLOATING EFFECTS ====== */}
        {tf >= 3 && (
          <g className="animate-float">
            <rect x={ix(4.5, 1) - 22} y={iy(4.5, 1, 3) - 10} width="44" height="20" rx="10" fill="white" stroke="#F0F0F0" strokeWidth="0.5" />
            <text x={ix(4.5, 1)} y={iy(4.5, 1, 3) + 4} textAnchor="middle" fill="#FF6B35" fontSize="9" fontWeight="bold">🔔 新订单</text>
          </g>
        )}
        {rp >= 2 && (
          <g className="animate-float-delay">
            <rect x={ix(1.2, 3.2) - 18} y={iy(1.2, 3.2, 2.5) - 9} width="36" height="18" rx="9" fill="#FFF8E1" stroke="#FFD100" strokeWidth="0.5" />
            <text x={ix(1.2, 3.2)} y={iy(1.2, 3.2, 2.5) + 4} textAnchor="middle" fill="#F59E0B" fontSize="8" fontWeight="bold">⭐ 好评!</text>
          </g>
        )}
        {rp >= 4 && (
          <g className="animate-bounce-in">
            <rect x={ix(2.5, 2.5) - 34} y={iy(0, 0, 4.5) - 52} width="68" height="20" rx="10" fill="#FFD100" />
            <text x={ix(2.5, 2.5)} y={iy(0, 0, 4.5) - 39} textAnchor="middle" fill="#333" fontSize="9" fontWeight="bold">🏅 金牌商家</text>
          </g>
        )}

        {/* Level */}
        <rect x="345" y="258" width="48" height="16" rx="8" fill="rgba(0,0,0,0.5)" />
        <text x="369" y="269" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Lv.{total}</text>
      </svg>
    </div>
  );
}
