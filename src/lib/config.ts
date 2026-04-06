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

// === 游戏参数 ===

export const GAME_CONFIG = {
  maxDay: 7,
  questionsPerDay: 4,
  initialCash: 10000,
  initialExposure: 100,
  initialConversion: 0.1,
  initialAvgPrice: 20,
  initialBadReviewRate: 0,
  dailyRent: 300,
  dailyStaff: 200,
};

export const INITIAL_STATE: GameState = {
  cash: GAME_CONFIG.initialCash,
  day: 1,
  exposure: GAME_CONFIG.initialExposure,
  conversion: GAME_CONFIG.initialConversion,
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
    conversion: clamp(state.conversion + (effect.conversion ?? 0), 0, 1),
    avgPrice: Math.max(0, state.avgPrice + (effect.avgPrice ?? 0)),
    badReviewRate: clamp(state.badReviewRate + (effect.badReviewRate ?? 0), 0, 1),
  };
}

export function calcDailyRevenue(state: GameState): number {
  const effectiveConv = state.conversion * (1 - state.badReviewRate * 0.5);
  return Math.round(state.exposure * effectiveConv * state.avgPrice);
}

// === 题库 ===

export const QUESTION_BANK: SimQuestion[] = [
  {
    id: "q001",
    title: "曝光下降了20%",
    desc: "昨天的订单比前天少了不少，打开后台发现曝光掉了。",
    options: [
      { text: "开启满30减5活动", effect: { cash: -300, exposure: 30, conversion: 0.02, badReviewRate: 0.01 } },
      { text: "直接降价3元", effect: { cash: -200, conversion: 0.03, avgPrice: -3 } },
      { text: "暂时不动，观察一天", effect: { exposure: -10 } },
    ],
  },
  {
    id: "q002",
    title: "差评率飙到8%",
    desc: "连续几单顾客抱怨出餐慢，差评率开始涨了。",
    options: [
      { text: "下午雇小时工支援后厨", effect: { cash: -400, badReviewRate: -0.05 } },
      { text: "关闭高峰期的满减，减单", effect: { exposure: -20, badReviewRate: -0.03 } },
      { text: "无视，撑过这波再说", effect: { badReviewRate: 0.03, conversion: -0.02 } },
    ],
  },
  {
    id: "q003",
    title: "平台客户经理推广",
    desc: "美团小二打电话说可以上点金推广，每天300预算。",
    options: [
      { text: "试一下，上300预算", effect: { cash: -300, exposure: 50 } },
      { text: "砸大一点，上800预算", effect: { cash: -800, exposure: 120, conversion: 0.01 } },
      { text: "不上，自然流量够了", effect: { exposure: -5 } },
    ],
  },
  {
    id: "q004",
    title: "竞争对手上了新品",
    desc: "隔壁家突然上了爆款套餐，你的订单明显被抢走。",
    options: [
      { text: "跟进上一个更便宜的套餐", effect: { cash: -200, conversion: 0.04, avgPrice: -2 } },
      { text: "优化菜单把主推产品放首位", effect: { conversion: 0.03 } },
      { text: "不管，他那是亏本冲量", effect: { exposure: -15, conversion: -0.02 } },
    ],
  },
  {
    id: "q005",
    title: "老客户流失",
    desc: "后台显示复购率下降了，一些老客户30天没回来。",
    options: [
      { text: "给老客户发8折召回券", effect: { cash: -250, exposure: 20, conversion: 0.02 } },
      { text: "升级包装+送小赠品", effect: { cash: -350, badReviewRate: -0.02, conversion: 0.02 } },
      { text: "不处理，新客进的很快", effect: { conversion: -0.03 } },
    ],
  },
  {
    id: "q006",
    title: "高峰期爆单",
    desc: "中午11:30-1:00订单暴涨，后厨快顶不住了。",
    options: [
      { text: "限制接单，保质量", effect: { exposure: -10, badReviewRate: -0.03 } },
      { text: "硬扛，赚钱要紧", effect: { cash: 200, badReviewRate: 0.05 } },
      { text: "临时加钱叫骑手", effect: { cash: -300, badReviewRate: -0.02 } },
    ],
  },
  {
    id: "q007",
    title: "食材涨价15%",
    desc: "猪肉和蔬菜最近都涨价，毛利被压缩。",
    options: [
      { text: "涨价2块转嫁成本", effect: { avgPrice: 2, exposure: -20 } },
      { text: "换便宜供应商", effect: { badReviewRate: 0.04, cash: 100 } },
      { text: "自己扛着，保护回头客", effect: { cash: -400 } },
    ],
  },
  {
    id: "q008",
    title: "店铺评分降到4.3",
    desc: "平台评分跌破4.5，曝光开始受影响。",
    options: [
      { text: "主动联系差评用户赔付", effect: { cash: -300, badReviewRate: -0.05 } },
      { text: "找人刷好评", effect: { cash: -200, badReviewRate: -0.02, exposure: -10 } },
      { text: "优化出品，长远改善", effect: { cash: -150, badReviewRate: -0.03, conversion: 0.01 } },
    ],
  },
  {
    id: "q009",
    title: "周末流量高峰",
    desc: "周六周日订单量明显比工作日多。",
    options: [
      { text: "上周末限定套餐拉高客单", effect: { cash: -100, avgPrice: 3, conversion: 0.02 } },
      { text: "加大推广预算抓流量", effect: { cash: -500, exposure: 80 } },
      { text: "维持现状不动", effect: {} },
    ],
  },
  {
    id: "q010",
    title: "菜单点击低",
    desc: "后台数据显示80%的用户看完菜单就走了。",
    options: [
      { text: "换封面图，换爆款排序", effect: { conversion: 0.04 } },
      { text: "全部菜品打9折", effect: { cash: -200, conversion: 0.03, avgPrice: -2 } },
      { text: "换个视频做菜单", effect: { cash: -500, conversion: 0.05 } },
    ],
  },
  {
    id: "q011",
    title: "订单量停滞",
    desc: "这几天订单一直卡在一个数字上不去。",
    options: [
      { text: "上新品刺激复购", effect: { cash: -300, conversion: 0.03, exposure: 20 } },
      { text: "做大额满减拉新", effect: { cash: -500, exposure: 60, avgPrice: -1 } },
      { text: "重新拍产品图", effect: { cash: -200, conversion: 0.02 } },
    ],
  },
  {
    id: "q012",
    title: "新骑手配送慢",
    desc: "最近平台新骑手多，配送时间明显变长。",
    options: [
      { text: "减少配送范围", effect: { exposure: -30, badReviewRate: -0.04 } },
      { text: "提前5分钟出餐", effect: { cash: -200, badReviewRate: -0.03 } },
      { text: "订单打包多加保温袋", effect: { cash: -150, badReviewRate: -0.02 } },
    ],
  },
  {
    id: "q013",
    title: "隔壁发小广告",
    desc: "隔壁竞品在发传单抢你的小区用户。",
    options: [
      { text: "也发传单反击", effect: { cash: -300, exposure: 40 } },
      { text: "做社群运营老客户", effect: { cash: -200, conversion: 0.04 } },
      { text: "不理会", effect: { exposure: -20 } },
    ],
  },
  {
    id: "q014",
    title: "菜品成本核算错了",
    desc: "会计发现主推菜品其实是亏本卖的。",
    options: [
      { text: "立即下架亏损菜", effect: { conversion: -0.03, cash: 200 } },
      { text: "偷偷涨价1元", effect: { avgPrice: 1, exposure: -10 } },
      { text: "换配方降成本", effect: { badReviewRate: 0.03, cash: 300 } },
    ],
  },
  {
    id: "q015",
    title: "竞品降价促销",
    desc: "隔壁家全线降价20%，你的顾客在流失。",
    options: [
      { text: "硬跟，我也降价", effect: { avgPrice: -3, cash: -200, conversion: 0.02 } },
      { text: "做差异化推高端套餐", effect: { cash: -300, avgPrice: 5, exposure: -10 } },
      { text: "稳住不动", effect: { exposure: -30, conversion: -0.02 } },
    ],
  },
  {
    id: "q016",
    title: "出品不稳定",
    desc: "同一道菜今天咸明天淡，有顾客投诉。",
    options: [
      { text: "标准化配方+称重", effect: { cash: -300, badReviewRate: -0.05 } },
      { text: "换个主厨", effect: { cash: -800, badReviewRate: -0.06, conversion: 0.02 } },
      { text: "送赠品平复", effect: { cash: -200, badReviewRate: -0.02 } },
    ],
  },
  {
    id: "q017",
    title: "小区业主群",
    desc: "发现你店所在小区有几个活跃的业主群。",
    options: [
      { text: "进群发红包做活动", effect: { cash: -300, exposure: 50, conversion: 0.03 } },
      { text: "找群主合作推广", effect: { cash: -500, exposure: 80 } },
      { text: "不理会", effect: {} },
    ],
  },
  {
    id: "q018",
    title: "骑手偷餐",
    desc: "收到一起骑手偷餐投诉，顾客很生气。",
    options: [
      { text: "直接补偿顾客全额", effect: { cash: -100, badReviewRate: -0.03 } },
      { text: "改用防撕封口贴", effect: { cash: -200, badReviewRate: -0.02 } },
      { text: "让顾客找平台", effect: { badReviewRate: 0.04, conversion: -0.01 } },
    ],
  },
  {
    id: "q019",
    title: "平台扣点上调",
    desc: "平台把佣金从18%上调到21%。",
    options: [
      { text: "所有菜品涨2元", effect: { avgPrice: 2, exposure: -25 } },
      { text: "精简菜单保利润", effect: { conversion: -0.02, cash: 200 } },
      { text: "不变，自己扛", effect: { cash: -400 } },
    ],
  },
  {
    id: "q020",
    title: "第7天最后冲刺",
    desc: "最后一天了，要搏一把大的还是稳着收尾？",
    options: [
      { text: "all in 推广+满减", effect: { cash: -800, exposure: 150, conversion: 0.05, avgPrice: -2 } },
      { text: "稳着收尾", effect: { cash: 100 } },
      { text: "涨价收割", effect: { avgPrice: 4, exposure: -30 } },
    ],
  },
];

// === 随机事件库 ===

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: "e1", title: "平台流量扶持", desc: "被选中为本区新店推荐，免费曝光+50", effect: { exposure: 50 }, emoji: "🎁" },
  { id: "e2", title: "爆品火了", desc: "你家招牌菜突然被小红书推爆", effect: { exposure: 40, conversion: 0.03 }, emoji: "🔥" },
  { id: "e3", title: "差评爆发", desc: "一个恶意差评被顶到首位", effect: { badReviewRate: 0.05, conversion: -0.03 }, emoji: "💢" },
  { id: "e4", title: "骑手延误", desc: "暴雨导致骑手严重延误", effect: { badReviewRate: 0.04, exposure: -10 }, emoji: "🌧️" },
  { id: "e5", title: "网红探店", desc: "一位小网红主动来探店", effect: { exposure: 30, conversion: 0.02 }, emoji: "📸" },
  { id: "e6", title: "食品安全检查", desc: "今日突击检查，需要整改", effect: { cash: -300, badReviewRate: -0.02 }, emoji: "🏥" },
  { id: "e7", title: "下雨订单暴涨", desc: "大雨导致外卖订单翻倍", effect: { exposure: 60, cash: 200 }, emoji: "☔" },
  { id: "e8", title: "老客集中消费", desc: "几个大客户同时点单", effect: { cash: 400, avgPrice: 1 }, emoji: "💰" },
  { id: "e9", title: "员工请假", desc: "后厨有人请假，出餐慢了", effect: { badReviewRate: 0.03, cash: 100 }, emoji: "😷" },
  { id: "e10", title: "竞品关店", desc: "隔壁家突然关门，你捡到流量", effect: { exposure: 40, conversion: 0.02 }, emoji: "🎉" },
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
  if (finalState.badReviewRate <= 0.02 && finalState.conversion >= 0.12) return "reputation_guard";
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
