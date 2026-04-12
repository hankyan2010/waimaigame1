"use client";

export function BrandBar() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5" style={{
      background: "linear-gradient(135deg, #FFD100 0%, #FFB800 100%)",
      borderRadius: "14px",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/brand-logo.png`}
        alt="蒜头"
        style={{ width: 32, height: 32, borderRadius: 8 }}
      />
      <div>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#111", letterSpacing: 1 }}>
          蒜头外卖运营课堂
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
          学外卖 做外卖 找正规军
        </div>
      </div>
    </div>
  );
}
