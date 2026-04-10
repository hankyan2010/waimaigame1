"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { ENDING_INFO, TAG_INFO, GAME_CONFIG } from "@/lib/config";
import { track } from "@/lib/track";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";

export default function RewardPage() {
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    if (store.endingType) {
      track("reward_page_view", { ending: store.endingType });
    }
    // 确保有玩家 ID + 拉取邀请额度
    useGameStore.getState().ensurePlayerId();
    useGameStore.getState().refreshInviteCredits();
  }, []);

  if (!hydrated) return null;

  if (!store.endingType || !store.playerTag) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <p className="text-sm text-secondary mb-4">还没完成一局挑战</p>
        <button onClick={() => router.push("/")} className="btn-raised text-sm max-w-xs">
          回首页
        </button>
      </div>
    );
  }

  const ending = ENDING_INFO[store.endingType];
  const tag = TAG_INFO[store.playerTag];
  const finalCash = store.state.cash;
  const profit = finalCash - GAME_CONFIG.initialCash;
  const isBankrupt = store.endingType === "bankrupt";

  const handleReplay = () => {
    store.reset();
    router.push("/");
    track("reward_replay");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top */}
      <div className="bg-brand pt-6 pb-10 px-6 rounded-b-[2rem]">
        <div className="text-center">
          <div className="inline-flex items-center bg-black/10 px-3 py-1 rounded-full mb-2">
            <span className="text-xs font-medium text-title">
              {isBankrupt ? "看看高手怎么做" : "经营福利已解锁"}
            </span>
          </div>
          <div className="text-3xl mb-1">{ending.emoji}</div>
          <h1 className="text-xl font-black text-title">{ending.title}</h1>
          <p className="text-xs text-title/70 mt-0.5">
            {isBankrupt
              ? `你刚刚亏了¥${Math.abs(profit)}，其实你只犯了3个错误`
              : `7天赚了¥${profit}，你已经是个不错的老板了`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10">
        {/* QR + rewards */}
        <div className="flex gap-2">
          <div className="bg-card rounded-2xl p-2.5 shadow-sm text-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}/qrcode.png`}
              alt="扫码加微信"
              className="w-24 h-24 mx-auto rounded-lg"
            />
            <p className="text-[10px] text-secondary mt-1 leading-tight">
              扫码加微信
              <br />
              备注「高手」
            </p>
          </div>
          <div className="bg-card rounded-2xl p-3 shadow-sm flex-1 min-w-0">
            <p className="text-xs font-bold text-title mb-1.5">
              📦 外卖老板实战资料包（价值¥299）
            </p>
            <div className="space-y-1">
              {[
                "《外卖菜单定价公式表》— 一键算出每个菜该卖多少钱",
                "《美团/饿了么推广ROI计算器》— 知道每块钱花得值不值",
                "《差评处理话术模板30条》— 照着念就能挽回客户",
                "《新店7天冷启动SOP》— 从0到日均50单的操作手册",
                "《外卖包装成本优化清单》— 省出来的都是纯利润",
                "《高峰期出餐效率自查表》— 3分钟找到你的瓶颈",
              ].map((item) => (
                <div key={item} className="flex items-start gap-1">
                  <span className="text-success text-[10px] mt-0.5">✅</span>
                  <span className="text-[11px] text-body leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnosis for bankrupt */}
        {isBankrupt && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-bold text-title mb-2">💡 你的经营诊断</p>
            <p className="text-xs text-body leading-relaxed mb-2">
              作为 <span className="font-bold">{tag.label}</span>，你踩中的常见坑：
            </p>
            <ul className="space-y-1 text-xs text-secondary">
              {store.playerTag === "price_killer" && (
                <>
                  <li>• 过度降价牺牲毛利，烧完就倒</li>
                  <li>• 没有建立差异化壁垒</li>
                  <li>• 忽略了回头客价值</li>
                </>
              )}
              {store.playerTag === "traffic_gambler" && (
                <>
                  <li>• 过度依赖付费流量</li>
                  <li>• 转化率没跟上就砸钱</li>
                  <li>• 没有沉淀私域流量</li>
                </>
              )}
              {(store.playerTag === "rookie_dead" ||
                store.playerTag === "balanced_master") && (
                <>
                  <li>• 固定成本结构不合理</li>
                  <li>• 决策节奏没把控好</li>
                  <li>• 口碑管理不到位</li>
                </>
              )}
            </ul>
          </div>
        )}

      </div>

      {/* Bottom */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent space-y-2">
        <button
          onClick={handleReplay}
          className="btn-raised-ghost text-base"
        >
          再来一局
        </button>
      </div>

    </div>
  );
}
