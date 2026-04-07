// 外卖老板生存模拟器 v2.0 配置
import {
  SimQuestion,
  RandomEvent,
  GameState,
  OptionEffect,
  EndingInfo,
  EndingType,
  TagInfo,
  PlayerTag,
  ResultLevel,
  UpgradeOption,
} from "./types";

// === 游戏参数 (v3.2 重新平衡) ===

export const GAME_CONFIG = {
  maxDay: 7,
  questionsPerDay: 4,
  initialCash: 10000,
  initialExposure: 1500,         // 开局曝光 1500人/天
  initialEnterConversion: 0.08,  // 入店转化 8%
  initialOrderConversion: 0.15,  // 下单转化 15%
  initialAvgPrice: 25,           // 客单 ¥25
  initialBadReviewRate: 0.05,    // 开局差评 5%
  dailyRent: 300,
  dailyStaff: 200,
};

export const INITIAL_STATE: GameState = {
  cash: GAME_CONFIG.initialCash,
  day: 1,
  exposure: GAME_CONFIG.initialExposure,
  enterConversion: GAME_CONFIG.initialEnterConversion,
  orderConversion: GAME_CONFIG.initialOrderConversion,
  avgPrice: GAME_CONFIG.initialAvgPrice,
  badReviewRate: GAME_CONFIG.initialBadReviewRate,
};

export const DAILY_COST = GAME_CONFIG.dailyRent + GAME_CONFIG.dailyStaff;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function applyEffect(state: GameState, effect: OptionEffect): GameState {
  return {
    ...state,
    cash: state.cash + (effect.cash ?? 0),
    exposure: Math.max(0, state.exposure + (effect.exposure ?? 0)),
    enterConversion: clamp(state.enterConversion + (effect.enterConversion ?? 0), 0, 1),
    orderConversion: clamp(state.orderConversion + (effect.orderConversion ?? 0), 0, 1),
    avgPrice: Math.max(0, state.avgPrice + (effect.avgPrice ?? 0)),
    badReviewRate: clamp(state.badReviewRate + (effect.badReviewRate ?? 0), 0, 1),
  };
}

/**
 * 营业额公式：
 *   订单数 = 曝光 × 入店转化率 × 下单转化率 × (1 - 差评率×0.5)
 *   营业额 = 订单数 × 客单价
 *
 * 例：1500 × 8% × 15% × (1-5%×0.5) = 17.55 单 ≈ 18 单 × ¥25 ≈ ¥450
 */
export function calcDailyRevenue(state: GameState): number {
  return Math.round(calcOrders(state) * state.avgPrice);
}

export function calcOrders(state: GameState): number {
  const effective = state.enterConversion * state.orderConversion * (1 - state.badReviewRate * 0.5);
  return Math.round(state.exposure * effective);
}

export function calcEffectiveOrderConv(state: GameState): number {
  return state.orderConversion * (1 - state.badReviewRate * 0.5);
}

// === 题库 ===

export { QUESTION_BANK } from "./questions";

// === 随机事件库 ===

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: "e1", title: "平台流量扶持", desc: "被选中为本区新店推荐，免费曝光大涨", effect: { exposure: 250 }, emoji: "🎁" },
  { id: "e2", title: "爆品火了", desc: "你家招牌菜突然被小红书推爆", effect: { exposure: 200, orderConversion: 0.015 }, emoji: "🔥" },
  { id: "e3", title: "差评爆发", desc: "一个恶意差评被顶到首位", effect: { badReviewRate: 0.03, orderConversion: -0.01 }, emoji: "💢" },
  { id: "e4", title: "骑手延误", desc: "暴雨导致骑手严重延误", effect: { badReviewRate: 0.02, exposure: -50 }, emoji: "🌧️" },
  { id: "e5", title: "网红探店", desc: "一位小网红主动来探店", effect: { exposure: 150, enterConversion: 0.01 }, emoji: "📸" },
  { id: "e6", title: "食品安全检查", desc: "今日突击检查，需要整改", effect: { cash: -300, badReviewRate: -0.01 }, emoji: "🏥" },
  { id: "e7", title: "下雨订单暴涨", desc: "大雨导致外卖订单翻倍", effect: { exposure: 300, cash: 200 }, emoji: "☔" },
  { id: "e8", title: "老客集中消费", desc: "几个大客户同时点单", effect: { cash: 400, avgPrice: 1 }, emoji: "💰" },
  { id: "e9", title: "员工请假", desc: "后厨有人请假，出餐慢了", effect: { badReviewRate: 0.02, cash: 100 }, emoji: "😷" },
  { id: "e10", title: "竞品关店", desc: "隔壁家突然关门，你捡到流量", effect: { exposure: 200, enterConversion: 0.01 }, emoji: "🎉" },
];

// === 结局规则 ===

export function determineEnding(finalCash: number, initialCash: number, day: number): EndingType {
  if (finalCash <= 0) return "bankrupt";
  const profitRate = (finalCash - initialCash) / initialCash;
  if (profitRate >= 0.3) return "thrive";
  return "survive";
}

export const ENDING_INFO: Record<EndingType, EndingInfo> = {
  bankrupt: {
    type: "bankrupt",
    title: "倒闭了",
    emoji: "💀",
    description: "现金耗尽，店铺关门大吉。下次再来吧！",
    color: "#DC2626",
  },
  survive: {
    type: "survive",
    title: "勉强存活",
    emoji: "😐",
    description: "没赚到什么钱，但好歹活下来了。下一次能不能爆发？",
    color: "#9CA3AF",
  },
  thrive: {
    type: "thrive",
    title: "爆赚出圈",
    emoji: "🚀",
    description: "7天赚翻，你就是外卖圈的隐藏高手！",
    color: "#F59E0B",
  },
};

// === 玩家标签 ===

export const TAG_INFO: Record<PlayerTag, TagInfo> = {
  price_killer: { id: "price_killer", label: "价格屠夫型", emoji: "🗡️", desc: "靠降价换订单，利润薄如刀" },
  traffic_gambler: { id: "traffic_gambler", label: "流量赌徒型", emoji: "🎰", desc: "all in 推广，赢了通吃输了破产" },
  profit_harvester: { id: "profit_harvester", label: "利润收割型", emoji: "💰", desc: "死守毛利，闷声发财的真老板" },
  reputation_guard: { id: "reputation_guard", label: "口碑守护型", emoji: "⭐", desc: "质量至上，靠回头客吃饭" },
  balanced_master: { id: "balanced_master", label: "均衡派", emoji: "⚖️", desc: "每一步都稳，没有短板" },
  rookie_dead: { id: "rookie_dead", label: "外卖小白", emoji: "😵", desc: "还没搞清楚外卖怎么玩就倒了" },
};

export function determinePlayerTag(
  ending: EndingType,
  finalState: GameState,
  avgPriceChange: number,
  totalAdSpend: number
): PlayerTag {
  if (ending === "bankrupt") return "rookie_dead";
  if (avgPriceChange <= -4) return "price_killer";
  if (totalAdSpend >= 1500) return "traffic_gambler";
  if (finalState.badReviewRate <= 0.03 && finalState.orderConversion >= 0.18) return "reputation_guard";
  if (finalState.cash >= GAME_CONFIG.initialCash * 1.4) return "profit_harvester";
  return "balanced_master";
}

// === 每日点评模板 ===

export function generateDailyComment(summary: {
  profit: number;
  revenue: number;
  exposure: number;
  badReviewRate: number;
  avgPriceDelta: number;
}): string {
  const { profit, exposure, badReviewRate, avgPriceDelta } = summary;

  if (profit < -500) return "今天方向错误，正在严重亏损";
  if (profit < 0) return "今天在烧钱换增长，小心现金流";
  if (avgPriceDelta < -2) return "你在用低价换流量，利润被压扁了";
  if (badReviewRate > 0.05) return "差评在积累，口碑是外卖的命根";
  if (exposure > 150) return "曝光拉起来了，继续优化转化";
  if (profit > 500) return "稳中有升，这就是做外卖的正道";
  return "今天平稳过渡，看明天能不能发力";
}

// === 旧系统兼容：保留结果段位/升级池/小贴士 ===

export const RESULT_LEVELS: ResultLevel[] = [
  { title: "青铜掌柜", minScore: 0, maxScore: 39, description: "外卖入门级", emoji: "🥉" },
  { title: "白银店长", minScore: 40, maxScore: 59, description: "有些门道了", emoji: "🥈" },
  { title: "黄金操盘手", minScore: 60, maxScore: 79, description: "可以独当一面", emoji: "🥇" },
  { title: "王者掌门", minScore: 80, maxScore: 100, description: "外卖圈的高手", emoji: "👑" },
];

export function getResultLevel(score: number): ResultLevel {
  return (
    RESULT_LEVELS.find((l) => score >= l.minScore && score <= l.maxScore) ??
    RESULT_LEVELS[0]
  );
}

export const UPGRADE_POOL: UpgradeOption[] = [
  { category: "storefront", title: "升级门头", description: "让顾客一眼看到你", feedbackText: "门头 +1" },
  { category: "menu", title: "升级菜单", description: "让进店顾客更想下单", feedbackText: "菜单 +1" },
  { category: "kitchen", title: "升级后厨", description: "让高峰稳稳出餐", feedbackText: "后厨 +1" },
  { category: "traffic", title: "升级流量", description: "让更多顾客出现", feedbackText: "流量 +1" },
  { category: "reputation", title: "升级口碑", description: "让评分一起上涨", feedbackText: "口碑 +1" },
  { category: "member", title: "升级会员", description: "让老客反复下单", feedbackText: "会员 +1" },
];

export function getRandomUpgradeChoices(count: number = 3): UpgradeOption[] {
  return [...UPGRADE_POOL].sort(() => Math.random() - 0.5).slice(0, count);
}

export function getRandomTip(_category: string): string {
  return "经营外卖就是一场持久战";
}

// === leaderboard 兼容 ===

export const INITIAL_TIER = "survive";

export function getTierInfo(ending: string) {
  const info = ENDING_INFO[ending as EndingType] ?? ENDING_INFO.survive;
  return { id: ending, label: info.title, emoji: info.emoji, index: 0, group: ending };
}
