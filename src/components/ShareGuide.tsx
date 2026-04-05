"use client";

interface ShareGuideProps {
  onClose: () => void;
}

export function ShareGuide({ onClose }: ShareGuideProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70"
      onClick={onClose}
    >
      {/* Arrow pointing to top-right corner */}
      <div className="absolute top-2 right-4 flex flex-col items-end">
        {/* Arrow SVG */}
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="mr-2">
          <path
            d="M50 8 C45 5, 35 3, 30 15 C28 20, 30 25, 30 30"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="25,28 30,38 35,28" fill="white" />
        </svg>

        {/* Guide text */}
        <div className="mt-2 mr-0 bg-white rounded-2xl px-5 py-4 max-w-[260px] text-center">
          <p className="text-base font-black text-title mb-1">
            点击右上角 <span className="text-xl">···</span>
          </p>
          <p className="text-sm text-secondary mb-3">
            选择「分享到朋友圈」或「发送给朋友」
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#07C160] rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <circle cx="8" cy="8" r="2.5" />
                  <circle cx="16" cy="8" r="2.5" />
                  <circle cx="12" cy="16" r="2.5" />
                </svg>
              </div>
              <span className="text-[10px] text-secondary">朋友圈</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#07C160] rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M4 4h16v12H5.17L4 17.17V4z" />
                </svg>
              </div>
              <span className="text-[10px] text-secondary">发送给朋友</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-white/60 text-sm">点击任意位置关闭</p>
      </div>
    </div>
  );
}
