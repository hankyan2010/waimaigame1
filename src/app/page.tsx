"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top decoration */}
      <div className="bg-brand pt-8 pb-14 px-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full mb-3">
            <span className="text-xs font-medium text-title">
              外卖经营知识挑战
            </span>
          </div>

          <h1 className="text-2xl font-black text-title leading-tight mb-2">
            10题测出你的
            <br />
            <span className="text-[28px]">经营真本事</span>
          </h1>

          <p className="text-sm text-title/70 leading-snug max-w-[280px] mx-auto">
            别再靠感觉做外卖了
            <br />
            答完 10 题，看看你到底懂多少
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 -mt-12">
        {/* Reward hook card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <p className="text-sm font-bold text-title">完成挑战领福利</p>
              <p className="text-xs text-secondary">
                答题 + 养店，解锁你的专属经营福利
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "📊", label: "经营诊断" },
              { icon: "📖", label: "实战攻略" },
              { icon: "🎯", label: "专属方案" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-bg rounded-lg py-2 text-center"
              >
                <div className="text-lg mb-0.5">{item.icon}</div>
                <div className="text-xs text-secondary">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-3">
          <p className="text-sm font-bold text-title mb-3">挑战流程</p>
          <div className="flex items-center justify-between">
            {[
              { step: "1", label: "随机10题" },
              { step: "2", label: "答题升级" },
              { step: "3", label: "段位评定" },
              { step: "4", label: "领取福利" },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-sm font-bold text-title mb-1">
                    {item.step}
                  </div>
                  <span className="text-xs text-secondary">{item.label}</span>
                </div>
                {idx < 3 && (
                  <div className="w-6 h-[1px] bg-border mx-1 mb-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rank preview */}
        <div className="bg-card rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-bold text-title mb-3">段位等你挑战</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: "青铜掌柜", range: "0-39分", color: "#CD7F32" },
              { title: "白银店长", range: "40-59分", color: "#C0C0C0" },
              { title: "黄金操盘手", range: "60-79分", color: "#FFD700" },
              { title: "王者掌门", range: "80-100分", color: "#FF4500" },
            ].map((rank) => (
              <div
                key={rank.title}
                className="bg-bg rounded-lg px-3 py-2.5 flex items-center gap-2"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: rank.color }}
                />
                <div>
                  <p className="text-xs font-bold text-title">{rank.title}</p>
                  <p className="text-[10px] text-secondary">{rank.range}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="sticky bottom-0 px-6 pb-6 pt-3 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          onClick={() => router.push("/play")}
          className="w-full py-4 bg-brand text-title text-base font-black rounded-2xl shadow-lg shadow-brand/30 active:scale-[0.98] transition-transform"
        >
          立即开答
        </button>
        <p className="text-center text-xs text-secondary mt-2">
          满分100分，你能拿几分？
        </p>
      </div>
    </div>
  );
}
