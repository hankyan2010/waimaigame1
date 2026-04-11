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
    useGameStore.getState().ensurePlayerId();
    useGameStore.getState().refreshInviteCredits();
  }, []);

  if (!hydrated) return null;

  // 允许直接访问领奖页（测试用），没有游戏数据时用默认值
  const hasGameData = !!store.endingType && !!store.playerTag;
  const ending = hasGameData ? ENDING_INFO[store.endingType!] : ENDING_INFO.survive;
  const tag = hasGameData ? TAG_INFO[store.playerTag!] : TAG_INFO.balanced_master;
  const finalCash = hasGameData ? store.state.cash : GAME_CONFIG.initialCash;
  const profit = finalCash - GAME_CONFIG.initialCash;
  const isBankrupt = store.endingType === "bankrupt";

  const handleReplay = () => {
    track("reward_replay");
    if (store.canPlay()) {
      store.startNewGame();
      router.push("/play");
    } else {
      store.reset();
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top */}
      <div className="bg-brand pt-6 pb-10 px-6 rounded-b-[2rem]">
        <div className="text-center">
          <div className="inline-flex items-center bg-black/10 px-3 py-1 rounded-full mb-2">
            <span className="text-sm font-medium text-title">
              {isBankrupt ? "别急，高手也是从踩坑开始的" : "恭喜通关！领取你的经营武器库"}
            </span>
          </div>
          <div className="text-3xl mb-1">{ending.emoji}</div>
          <h1 className="text-2xl font-black text-title">{ending.title}</h1>
          <p className="text-sm text-title/70 mt-0.5">
            {isBankrupt
              ? `你亏了¥${Math.abs(profit)}——但下面这套资料能帮你在真实经营中赚回来`
              : `5天赚了¥${profit}——想在真实经营中复制这个成绩吗？`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 -mt-5 space-y-3 relative z-10">

        {/* 核心价值主张 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <p className="text-lg font-black text-title text-center mb-1">
            🔥 外卖实战资料包
          </p>
          <p className="text-xl font-black text-red-600 text-center mb-1">
            全部免费领取
          </p>
          <p className="text-sm text-secondary text-center mb-3">
            300+外卖老板验证有效 · 拿到就能用 · 用了就能涨
          </p>

          <div className="space-y-2.5">
            {[
              {
                icon: "📊",
                title: "菜单定价公式表",
                effect: "帮你每单多赚3-5块",
                detail: "输入食材成本，自动算出定价、毛利率、满减门槛。不用拍脑袋定价了。",
              },
              {
                icon: "💰",
                title: "推广ROI计算器",
                effect: "每月省下¥2000+推广费",
                detail: "一键算出点金、铂金、全站推广的投产比。花的每一块钱值不值，秒出结果。",
              },
              {
                icon: "⭐",
                title: "差评处理话术30条",
                effect: "差评回复率提升80%",
                detail: "照着念就行。骑手延误的、口味不合的、漏餐的……30种场景全覆盖，客户直接改评价。",
              },
              {
                icon: "🚀",
                title: "新店7天冷启动SOP",
                effect: "从0到日均50单的操作手册",
                detail: "第1天干啥、第2天干啥、第7天干啥，每天的动作拆到分钟级。已经帮200+新店跑通。",
              },
              {
                icon: "📦",
                title: "包装成本优化清单",
                effect: "包装费直降40%",
                detail: "同样的品质感，换个供应商+换个规格，一单省5毛。一个月30单/天就是省¥450。",
              },
              {
                icon: "⚡",
                title: "高峰出餐效率自查表",
                effect: "出餐速度提升30%",
                detail: "3分钟填完，立刻知道你的出餐流程卡在哪一步。附带改进方案，当天就能用。",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2.5">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-black text-title">{item.title}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 font-bold rounded">
                      {item.effect}
                    </span>
                  </div>
                  <p className="text-xs text-secondary leading-snug">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 活码二维码 + 领取引导 */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex gap-3 items-start">
            <div className="shrink-0 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}/qrcode.png`}
                alt="扫码领取"
                className="w-28 h-28 rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-title mb-1">
                👈 扫码领取全套资料
              </p>
              <p className="text-sm text-secondary leading-relaxed mb-2">
                加微信后回复「<span className="font-bold text-title">资料包</span>」，30秒内自动发送。
              </p>
              <div className="bg-brand/10 rounded-lg p-2">
                <p className="text-xs text-title leading-snug">
                  <span className="font-bold">额外福利：</span>加微信还能免费获得1次一对一经营诊断，由资深外卖运营专家帮你看店铺数据。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis for bankrupt */}
        {isBankrupt && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-base font-bold text-title mb-2">💡 你这局踩的坑</p>
            <p className="text-sm text-body leading-relaxed mb-2">
              作为 <span className="font-bold">{tag.label}</span>：
            </p>
            <ul className="space-y-1 text-sm text-secondary">
              {store.playerTag === "price_killer" && (
                <>
                  <li>• 过度降价牺牲毛利——利润全补贴给顾客了</li>
                  <li>• 没有用福利品拉客单价——主食引流、附加品赚钱</li>
                  <li>• 忽略了老客复购——拉新成本是留客的5倍</li>
                </>
              )}
              {store.playerTag === "traffic_gambler" && (
                <>
                  <li>• 转化率没做好就砸推广——流量来了也接不住</li>
                  <li>• 推广费占实收超过5%——投产比倒挂</li>
                  <li>• 没有沉淀私域——100%依赖平台=100%被平台控制</li>
                </>
              )}
              {(store.playerTag === "rookie_dead" ||
                store.playerTag === "balanced_master") && (
                <>
                  <li>• 盈亏平衡点没算清楚——不知道每天至少要做多少单</li>
                  <li>• 前期花钱太猛，后期没弹药了</li>
                  <li>• 差评没及时处理——差评有雪球效应</li>
                </>
              )}
            </ul>
            <p className="text-xs text-secondary mt-2 italic">
              上面的资料包里有对应的解决方案，领了就知道怎么改。
            </p>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="sticky bottom-0 px-4 pb-5 pt-3 bg-gradient-to-t from-bg via-bg to-transparent space-y-2">
        <button
          onClick={handleReplay}
          className="btn-raised-ghost text-lg"
        >
          再来一局
        </button>
      </div>
    </div>
  );
}
