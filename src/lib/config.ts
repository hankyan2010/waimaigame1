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
  DayStory,
  DaySummary,
  DiagnosisReport,
  DiagnosisDimension,
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

export const DAY_STORIES: DayStory[] = [
  {
    day: 1,
    title: "开业第一天",
    emoji: "🏪",
    intro: "你花了3万块装修，2万块买设备，终于在美团上线了。手机放在桌上，盯着商家后台的数字——外卖袋子叠了200个，一个都没用上。",
    mood: "期待又忐忑",
  },
  {
    day: 2,
    title: "流量焦虑",
    emoji: "📉",
    intro: "昨天只做了8单。你打开美团，发现隔壁那家店日均60单。你们品类一样，他菜单也没你好看。你开始琢磨：流量到底怎么搞？",
    mood: "焦虑",
  },
  {
    day: 3,
    title: "第一个差评",
    emoji: "⭐",
    intro: "早上醒来，一条1星差评：'等了50分钟，米饭都凉了。'你明明20分钟就出了餐，是骑手超时。但顾客不管这些，差评已经挂在那了。",
    mood: "委屈",
  },
  {
    day: 4,
    title: "利润去哪了",
    emoji: "🧮",
    intro: "忙了一整天，做了35单。你觉得今天不错，直到晚上算了一笔账——减去满减补贴、推广费、食材、包装、房租，发现只赚了47块。",
    mood: "崩溃",
  },
  {
    day: 5,
    title: "对面来了个新店",
    emoji: "⚔️",
    intro: "对面新开了一家同品类的店，满减力度比你大，价格比你低2块。今天你的单量掉了30%。你知道他在亏本冲量，但你的老客已经开始流失了。",
    mood: "紧张",
  },
  {
    day: 6,
    title: "流量越来越贵",
    emoji: "💸",
    intro: "你发现同样的推广预算，这周的曝光比上周少了20%。客户经理说'竞争加剧了，建议加预算'。但你上个月推广费已经占了实收的8%。",
    mood: "纠结",
  },
  {
    day: 7,
    title: "十字路口",
    emoji: "🔀",
    intro: "房东通知：下月涨租15%。你算了一下，按现在的利润率，涨完租就是干赔。摆在你面前三条路：硬撑、转型、关店。",
    mood: "决断",
  },
];

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

import { QUESTION_BANK } from "./questions";
export { QUESTION_BANK };

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

export function pickQuestionsForDay(day: number, excludeIds: string[]): SimQuestion[] {
  const count = GAME_CONFIG.questionsPerDay;
  // 优先抽当天的题
  const dayQuestions = QUESTION_BANK.filter(
    (q) => q.day === day && !excludeIds.includes(q.id)
  );
  if (dayQuestions.length >= count) {
    return [...dayQuestions].sort(() => Math.random() - 0.5).slice(0, count);
  }
  // 当天题不够，从全池补（排除已答的）
  const available = QUESTION_BANK.filter((q) => !excludeIds.includes(q.id) && q.day !== day);
  const pool = [...dayQuestions, ...available];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

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

export function generateDiagnosisReport(
  ending: EndingType,
  finalState: GameState,
  dailySummaries: DaySummary[],
  totalAdSpend: number,
  avgPriceChange: number
): DiagnosisReport {
  const dimensions: DiagnosisDimension[] = [];

  // 1. 流量获取
  const adRatio = dailySummaries.length > 0
    ? totalAdSpend / Math.max(1, dailySummaries.reduce((s, d) => s + d.incomeRevenue, 0))
    : 0;
  let trafficScore = 60;
  let trafficComment = "";
  if (adRatio > 0.08) {
    trafficScore = 30;
    trafficComment = "推广费占实收超过8%，严重倒挂。所有推广都要和点金比投产比，划算就用不划算就停，没有玄学。";
  } else if (adRatio > 0.05) {
    trafficScore = 50;
    trafficComment = "推广费略高。一般点金花费占实收的2-5%是健康范围。超过5%就该停下来想想了。";
  } else if (finalState.exposure > 2000) {
    trafficScore = 85;
    trafficComment = "流量获取不错。记住：店铺权重越高推广越便宜，持续做好基础功就是在降低获客成本。";
  } else if (finalState.exposure < 1000) {
    trafficScore = 40;
    trafficComment = "曝光量偏低。建议组合获客：点金推广+传单+社群。线下发传单现在反而比线上流量便宜。";
  } else {
    trafficComment = "流量获取中规中矩，可以考虑增加抖音等增量渠道。";
  }
  dimensions.push({ id: "traffic", name: "流量获取", score: trafficScore, comment: trafficComment });

  // 2. 转化效率（双转化）
  let convScore = 60;
  let convComment = "";
  const enterPct = finalState.enterConversion;
  const orderPct = finalState.orderConversion;
  if (enterPct >= 0.12 && orderPct >= 0.20) {
    convScore = 90;
    convComment = "双转化率优秀！入店率和下单率都在高位，同样的流量你能比对手多接很多单。";
  } else if (enterPct >= 0.10 || orderPct >= 0.18) {
    convScore = 70;
    convComment = "转化率不错。继续优化：入店率低改封面图和评分，下单率低改菜单结构和价格。";
  } else if (enterPct < 0.06 || orderPct < 0.12) {
    convScore = 30;
    convComment = "转化率很低，流量进来了但接不住。最优先：精简菜单、主推品放首位、封面图重拍。";
  } else {
    convScore = 50;
    convComment = "转化率偏低。先查入店率和下单率分别卡在哪里，对症下药比盲目砸推广有用。";
  }
  dimensions.push({ id: "conversion", name: "转化效率", score: convScore, comment: convComment });

  // 3. 口碑管理
  let repScore = 60;
  let repComment = "";
  if (finalState.badReviewRate <= 0.03) {
    repScore = 90;
    repComment = "口碑管理出色！差评率3%以下是安全线。记住：求好评比删差评更重要。";
  } else if (finalState.badReviewRate <= 0.06) {
    repScore = 60;
    repComment = "差评率在可控范围。用超预期法——把一个月的赠品集中一周送完，制造视觉冲击拉好评。";
  } else if (finalState.badReviewRate <= 0.10) {
    repScore = 35;
    repComment = "差评率偏高了。差评有雪球效应——差评越多，新用户越不敢下单。先解决出餐效率和品控。";
  } else {
    repScore = 15;
    repComment = "差评率严重超标！不接单率必须为0，平台缺的是流量不是商家，浪费流量会被报复。";
  }
  dimensions.push({ id: "reputation", name: "口碑管理", score: repScore, comment: repComment });

  // 4. 成本控制
  let costScore = 60;
  let costComment = "";
  if (avgPriceChange <= -4) {
    costScore = 25;
    costComment = "客单价暴跌！降价超过4元等于每单少赚16%。正确做法：主食微利引流，利润靠福利品赚。福利品应占菜单30%。";
  } else if (avgPriceChange <= -2) {
    costScore = 45;
    costComment = "客单价下滑明显。降价容易涨价难。建议用套餐组合拉客单价，比直接涨价更自然。";
  } else if (avgPriceChange >= 3) {
    costScore = 75;
    costComment = "客单价提升了，利润结构在改善。注意观察涨价后的流量变化。";
  } else {
    costScore = 65;
    costComment = "成本控制中等。建议核算每个菜品的真实毛利率，砍掉毛利低于30%的品。";
  }
  dimensions.push({ id: "cost", name: "成本控制", score: costScore, comment: costComment });

  // 5. 经营策略
  const profitTrend = dailySummaries.length >= 3
    ? dailySummaries.slice(-3).reduce((s, d) => s + d.profit, 0) / 3
    : dailySummaries.reduce((s, d) => s + d.profit, 0) / Math.max(dailySummaries.length, 1);
  let stratScore = 60;
  let stratComment = "";
  if (ending === "bankrupt") {
    stratScore = 20;
    stratComment = "经营节奏没踩对。核心：固定成本结构不合理+决策节奏差+口碑管理不到位。外卖是持久战，前3天应该保守试水。";
  } else if (profitTrend > 300) {
    stratScore = 85;
    stratComment = "经营策略很稳，后期利润在增长。为平台留住老客、减少客诉、提升流量利用率 = 平台给更多流量。";
  } else if (profitTrend > 0) {
    stratScore = 65;
    stratComment = "策略方向正确但力度不够。转化率是最高杠杆的指标——同样流量，转化翻倍等于曝光翻倍。";
  } else {
    stratScore = 40;
    stratComment = "利润趋势在下滑。先算清盈亏平衡点：（月房租+月人工+月杂项）÷毛利率÷30天 = 每日保本营业额。";
  }
  dimensions.push({ id: "strategy", name: "经营策略", score: stratScore, comment: stratComment });

  const avgScore = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const strongest = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const tag = determinePlayerTag(ending, finalState, avgPriceChange, totalAdSpend);

  let summary = "";
  if (ending === "bankrupt") {
    summary = `综合评分${avgScore}分。最大短板是「${weakest.name}」。别灰心，90%的外卖老板第一次都踩过这些坑。`;
  } else if (avgScore >= 75) {
    summary = `综合评分${avgScore}分，你的外卖经营直觉很准。最强项是「${strongest.name}」，继续保持。`;
  } else {
    summary = `综合评分${avgScore}分。最需要提升的是「${weakest.name}」——把这一项提到70分，整体利润至少翻一倍。`;
  }

  return { dimensions, summary, playerTag: tag };
}

// === leaderboard 兼容 ===

export const INITIAL_TIER = "survive";

export function getTierInfo(ending: string) {
  const info = ENDING_INFO[ending as EndingType] ?? ENDING_INFO.survive;
  return { id: ending, label: info.title, emoji: info.emoji, index: 0, group: ending };
}
