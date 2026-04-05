import { ResultLevel, UpgradeOption, RankTier, TierInfo } from "./types";

export const GAME_CONFIG = {
  questionCount: 10,
  scorePerQuestion: 10,
  totalScore: 100,
  passScore: 60, // 晋级分数线
};

// === 12 级等级体系 ===

export const TIER_LIST: TierInfo[] = [
  { id: "bronze3", label: "青铜3", group: "bronze", emoji: "🥉", index: 0 },
  { id: "bronze2", label: "青铜2", group: "bronze", emoji: "🥉", index: 1 },
  { id: "bronze1", label: "青铜1", group: "bronze", emoji: "🥉", index: 2 },
  { id: "silver3", label: "白银3", group: "silver", emoji: "🥈", index: 3 },
  { id: "silver2", label: "白银2", group: "silver", emoji: "🥈", index: 4 },
  { id: "silver1", label: "白银1", group: "silver", emoji: "🥈", index: 5 },
  { id: "gold3",   label: "黄金3", group: "gold",   emoji: "🥇", index: 6 },
  { id: "gold2",   label: "黄金2", group: "gold",   emoji: "🥇", index: 7 },
  { id: "gold1",   label: "黄金1", group: "gold",   emoji: "🥇", index: 8 },
  { id: "king3",   label: "王者3", group: "king",   emoji: "👑", index: 9 },
  { id: "king2",   label: "王者2", group: "king",   emoji: "👑", index: 10 },
  { id: "king1",   label: "王者1", group: "king",   emoji: "👑", index: 11 },
];

export const TIER_MAP: Record<RankTier, TierInfo> = Object.fromEntries(
  TIER_LIST.map((t) => [t.id, t])
) as Record<RankTier, TierInfo>;

export const INITIAL_TIER: RankTier = "bronze3";
export const MAX_TIER: RankTier = "king1";

/** 根据分数判断是否晋级，返回新等级信息 */
export function processRoundResult(
  currentTier: RankTier,
  score: number
): {
  passed: boolean;
  newTier: RankTier;
  promoted: boolean;
  nextRoundUnlocked: boolean;
} {
  const passed = score >= GAME_CONFIG.passScore;

  if (!passed) {
    return {
      passed: false,
      newTier: currentTier,
      promoted: false,
      nextRoundUnlocked: false, // 需要分享才能解锁
    };
  }

  const currentInfo = TIER_MAP[currentTier];
  const isMax = currentTier === MAX_TIER;

  if (isMax) {
    return {
      passed: true,
      newTier: currentTier,
      promoted: false,
      nextRoundUnlocked: true,
    };
  }

  const nextTier = TIER_LIST[currentInfo.index + 1];
  return {
    passed: true,
    newTier: nextTier.id,
    promoted: true,
    nextRoundUnlocked: true,
  };
}

/** 获取等级信息 */
export function getTierInfo(tier: RankTier): TierInfo {
  return TIER_MAP[tier];
}

/** 获取下一等级信息，已满级返回 null */
export function getNextTier(tier: RankTier): TierInfo | null {
  const info = TIER_MAP[tier];
  if (info.index >= TIER_LIST.length - 1) return null;
  return TIER_LIST[info.index + 1];
}

// === 老的段位结果（保留兼容，用于结果文案） ===

export const RESULT_LEVELS: ResultLevel[] = [
  {
    title: "青铜掌柜",
    minScore: 0,
    maxScore: 39,
    description:
      "你已经具备一点外卖经营常识，但整体还偏凭感觉做事。现在最该补的不是热闹，而是基础功。",
    emoji: "🥉",
  },
  {
    title: "白银店长",
    minScore: 40,
    maxScore: 59,
    description:
      "你懂一些关键点，也踩过一些坑，但体系还不完整。再往前一步，就不是\u201C会做\u201D，而是\u201C会经营\u201D。",
    emoji: "🥈",
  },
  {
    title: "黄金操盘手",
    minScore: 60,
    maxScore: 79,
    description:
      "你已经超过不少普通老板，知道流量、转化、复购这些关键问题。下一步，重点是把零散经验变成稳定打法。",
    emoji: "🥇",
  },
  {
    title: "王者掌门",
    minScore: 80,
    maxScore: 100,
    description:
      "你已经具备很强的经营判断力。继续把产品、运营、复购和利润结构串起来，店铺上限会非常高。",
    emoji: "👑",
  },
];

export const UPGRADE_POOL: UpgradeOption[] = [
  { category: "storefront", title: "升级门头", description: "让顾客一眼看到你", feedbackText: "门头吸引力 +1" },
  { category: "menu", title: "升级菜单", description: "让进店顾客更想下单", feedbackText: "菜单转化力 +1" },
  { category: "kitchen", title: "升级后厨", description: "让高峰期也能稳稳出餐", feedbackText: "后厨效率 +1" },
  { category: "traffic", title: "升级流量", description: "让更多顾客和骑手出现", feedbackText: "流量热度 +1" },
  { category: "reputation", title: "升级口碑", description: "让评分和信任感一起上涨", feedbackText: "口碑信任 +1" },
  { category: "member", title: "升级会员", description: "让老客更愿意反复下单", feedbackText: "老客复购 +1" },
];

export const UPGRADE_TIPS: Record<string, string[]> = {
  storefront: [
    "好的门头能让进店率提升30%以上，招牌要突出品类名",
    "门头灯光晚上比白天更重要，亮店永远比暗店有人气",
    "门面整洁度直接影响顾客信任感，第一印象决定进不进店",
    "品牌感不靠砸钱，统一的色调和清晰的LOGO就够了",
    "展示面被遮挡超过40%的铺位，再便宜也别租",
  ],
  menu: [
    "爆款要放在菜单最显眼的位置，让80%的人先看到它",
    "套餐组合能有效提高客单价15%-25%，别只卖单品",
    "菜单不是越多越好，精简到20-30个SKU转化更高",
    "菜品图片清晰诱人，下单率能直接提升20%以上",
    "价格带要有层次：引流款、利润款、形象款缺一不可",
  ],
  kitchen: [
    "出餐效率决定了高峰期能不能接住流量，慢就是丢钱",
    "标准化操作流程让出品更稳定，顾客要的是每次都一样好吃",
    "备料充足是高峰不崩的关键，缺货退单平台会降权",
    "不接单率必须控制到0，平台最恨浪费流量的商家",
    "打包流程标准化，能减少80%的漏装和错装投诉",
  ],
  traffic: [
    "点金推广是最精准的投放方式，花费占实收2%-5%是健康区间",
    "新客和老客定向要分开投，新店重点投新客，下滑时拉老客",
    "自然流量的基础是转化率够高，转化差的店砸钱也是浪费",
    "线下传单现在反而可能比线上流量更便宜，别忽略",
    "霸王餐停了流量就跌，说明店铺基础有问题，不能靠外力硬撑",
  ],
  reputation: [
    "求好评比删差评更重要，主动设计邀评体验才是正路",
    "超预期体验是优质评价的源头：一个月赠品集中一周送完制造冲击",
    "好评率每提升0.1分，进店转化率能提升3%-5%",
    "差评先找问题根因再优化流程，光删评治标不治本",
    "稳定交付体验是长期评分上升的唯一正解",
  ],
  member: [
    "老客复购成本只有获客成本的1/5，守住老客就是省钱",
    "会员体系的核心是让客户有理由回来，而不是打折",
    "评价得券要有吸引力，1-2块的小券没人在乎",
    "私域运营是摆脱平台依赖的关键，加微信比发券值钱",
    "回头客多的店，平台更愿意给流量倾斜",
  ],
};

export function getRandomTip(category: string): string {
  const tips = UPGRADE_TIPS[category] ?? UPGRADE_TIPS.storefront;
  return tips[Math.floor(Math.random() * tips.length)];
}

export function getResultLevel(score: number): ResultLevel {
  return (
    RESULT_LEVELS.find((l) => score >= l.minScore && score <= l.maxScore) ??
    RESULT_LEVELS[0]
  );
}

export function getRandomUpgradeChoices(count: number = 3): UpgradeOption[] {
  const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
