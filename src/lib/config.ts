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
  maxDay: 5,
  questionsPerDay: 4,
  initialCash: 10000,
  initialExposure: 1500,         // 开局曝光 1500人/天
  initialEnterConversion: 0.08,  // 入店转化 8%
  initialOrderConversion: 0.15,  // 下单转化 15%
  initialAvgPrice: 25,           // 客单 ¥25
  initialBadReviewRate: 0.03,    // 开局差评 3%（降低给好玩家更高天花板）
  dailyRent: 450,
  dailyStaff: 350,
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

/**
 * v4.4 数值设计目标：
 * - 差的情况：1000 × 5% × 10% × ¥20 = ¥100/天
 * - 好的情况：3000 × 15% × 25% × ¥30 = ¥3375/天
 * - 差距33倍，乘法效应让每个决策都是生死抉择
 * - 倒闭率目标：30-40%
 * - 暴赚路线：5天 ¥50000+
 */

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
    title: "最终决战",
    emoji: "🔥",
    intro: "最后一天了。房东说下月涨租，对面新开了竞品，推广费越来越贵。今天的每一个决策，都决定你是赚着离场还是亏本出局。",
    mood: "背水一战",
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
  // === 暴赚事件 ===
  { id: "e1", title: "平台爆量扶持", desc: "被选为本区重点扶持新店，曝光暴涨！", effect: { exposure: 2000 }, emoji: "🎁" },
  { id: "e2", title: "美食博主百万播放", desc: "一个百万粉博主自发推荐了你的店！入店率翻倍", effect: { exposure: 1500, enterConversion: 0.06 }, emoji: "🔥" },
  { id: "e7", title: "暴雨订单狂潮", desc: "连续暴雨，全城点外卖，订单翻3倍", effect: { exposure: 1000, cash: 1500, orderConversion: 0.03 }, emoji: "☔" },
  { id: "e8", title: "企业团餐大单", desc: "隔壁公司200人团建，全点了你家", effect: { cash: 3000, avgPrice: 5 }, emoji: "💰" },
  { id: "e10", title: "竞品集体关门", desc: "同品类3家店同时关门，你独吞流量", effect: { exposure: 1500, enterConversion: 0.04 }, emoji: "🎉" },
  { id: "e12", title: "抖音自然爆单", desc: "顾客发的短视频突然火了，50万播放", effect: { exposure: 2000, enterConversion: 0.05, orderConversion: 0.03 }, emoji: "📱" },

  // === 暴死事件 ===
  { id: "e3", title: "食品安全事故", desc: "顾客吃出异物，12315投诉+差评轰炸", effect: { cash: -5000, badReviewRate: 0.08, orderConversion: -0.04 }, emoji: "☠️" },
  { id: "e4", title: "平台封店3天", desc: "被举报违规操作，平台暂停营业3天", effect: { cash: -3000, exposure: -1000 }, emoji: "🚫" },
  { id: "e6", title: "骑手集体罢工", desc: "配送站骑手集体请假，今天几乎0配送", effect: { cash: -2000, badReviewRate: 0.06 }, emoji: "🏃" },
  { id: "e9", title: "后厨集体辞职", desc: "主厨带走两个帮工，今天出餐崩了", effect: { cash: -2500, badReviewRate: 0.06, orderConversion: -0.03 }, emoji: "😱" },
  { id: "e11", title: "食材全部变质", desc: "冷柜半夜断电，今天的食材全废了", effect: { cash: -3000, badReviewRate: 0.04 }, emoji: "🤮" },
  { id: "e13", title: "恶意差评轰炸", desc: "竞品雇水军刷了20条1星差评", effect: { badReviewRate: 0.10, enterConversion: -0.03, orderConversion: -0.04 }, emoji: "💢" },

  // === 中等事件 ===
  { id: "e5", title: "网红探店", desc: "一位小网红主动来探店发帖", effect: { exposure: 800, enterConversion: 0.03 }, emoji: "📸" },
  { id: "e14", title: "隔壁开了新店", desc: "同品类新店开业大促，分走你的流量", effect: { exposure: -500, enterConversion: -0.02 }, emoji: "😤" },
  { id: "e15", title: "房东涨租", desc: "房东突然要涨租30%，这个月多交¥1500", effect: { cash: -1500 }, emoji: "🏠" },
  { id: "e16", title: "老客带新客", desc: "忠实顾客在业主群推荐了你", effect: { exposure: 600, orderConversion: 0.02 }, emoji: "👥" },
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
    description: "5天赚翻，你就是外卖圈的隐藏高手！",
    color: "#F59E0B",
  },
};

// === 玩家标签 ===

export const TAG_INFO: Record<PlayerTag, TagInfo> = {
  price_killer:     { id: "price_killer",     label: "价格屠夫",     emoji: "🗡️", desc: "别人还在算成本，你已经把底裤都降没了。客单价跌成白菜价，薄利多销的'薄'字被你玩明白了——薄到透明。" },
  traffic_gambler:  { id: "traffic_gambler",  label: "流量赌狗",     emoji: "🎰", desc: "推广预算比房租还高，你不是在做外卖，你是在给美团打工。别人开店赚钱，你开店赚了个寂寞。" },
  profit_harvester: { id: "profit_harvester", label: "利润貔貅",     emoji: "🤑", desc: "你的钱只进不出，堪称外卖界貔貅。闷声发大财，同行还在卷价格，你已经在数钱了。" },
  reputation_guard: { id: "reputation_guard", label: "好评舔狗",     emoji: "⭐", desc: "为了五星好评可以上刀山下油锅。顾客虐你千百遍，你待顾客如初恋。差评率比你的体脂率还低。" },
  balanced_master:  { id: "balanced_master",  label: "六边形战士",   emoji: "💎", desc: "流量、转化、口碑、成本、利润，没有短板。你不是最秀的，但你是最稳的——活到最后的都是你这种人。" },
  rookie_dead:      { id: "rookie_dead",      label: "韭菜本菜",     emoji: "🥬", desc: "平台割完房东割，房东割完员工割。你以为你是老板，其实你是移动ATM。钱花了，人累了，店没了。" },
  coupon_addict:    { id: "coupon_addict",    label: "满减上瘾症",   emoji: "🏷️", desc: "满减一开流量哗哗来，满减一关店里冷清清。你不是在经营餐饮，你是在经营一家补贴发放站。" },
  data_nerd:        { id: "data_nerd",        label: "数据偏执狂",   emoji: "🤓", desc: "入店率精确到小数点后三位，转化率倒背如流。你可能不太会炒菜，但你绝对会看后台——外卖圈最强分析师。" },
  cost_miser:       { id: "cost_miser",       label: "铁公鸡",       emoji: "🐔", desc: "推广？不投。赠品？没有。满减？想都别想。省下来的每一分钱都在你口袋里，但顾客也都在别人店里。" },
  yolo_boss:        { id: "yolo_boss",        label: "梭哈型老板",   emoji: "🃏", desc: "要么暴赚要么暴亏，不存在中间状态。你的经营风格就像你打德州——全押，不留后路。心脏得够大才能当你的合伙人。" },
  survivor_king:    { id: "survivor_king",    label: "苟活大师",     emoji: "🐢", desc: "利润就像你的头发——稀少但顽强。不赚大钱但绝不倒闭，你是外卖圈的打不死的小强。房东最怕你这种——死都不搬。" },
  speed_demon:      { id: "speed_demon",      label: "闪电出餐怪",   emoji: "⚡", desc: "差评率低到离谱，出餐速度堪比外卖界博尔特。你家骑手从来不用等餐，甚至骑手还没到你已经在门口举着了。" },
  review_beggar:    { id: "review_beggar",    label: "好评乞讨师",   emoji: "🙏", desc: "赠品比正餐还多，外卖袋里塞的小卡片快比菜单厚了。顾客打开外卖发现：一份饭，八份赠品，三张好评卡。" },
  menu_artist:      { id: "menu_artist",      label: "菜单艺术家",   emoji: "🎨", desc: "你的菜单排版比《时尚芭莎》还精致，封面图能拿去参加摄影展。别人卖的是饭，你卖的是视觉艺术——下单率高得离谱。" },
  lucky_dog:        { id: "lucky_dog",        label: "欧皇附体",     emoji: "🍀", desc: "竞品关门、网红自来、平台扶持全让你赶上了。你的经营能力一般，但你的运气能去买彩票。老天爷追着喂你饭吃。" },
  disaster_magnet:  { id: "disaster_magnet",  label: "灾难吸铁石",   emoji: "🧲", desc: "暴雨、差评、骑手跑路、食材涨价，全让你一个人赶上了。你不是在经营外卖，你是在渡劫。建议下辈子投胎选个好商圈。" },
};

export function determinePlayerTag(
  ending: EndingType,
  finalState: GameState,
  avgPriceChange: number,
  totalAdSpend: number
): PlayerTag {
  const profit = finalState.cash - GAME_CONFIG.initialCash;
  const profitRate = profit / GAME_CONFIG.initialCash;

  // === 倒闭类（3种） ===
  if (ending === "bankrupt") {
    if (totalAdSpend >= 6000) return "traffic_gambler";   // 砸推广砸死的
    if (avgPriceChange <= -12) return "price_killer";     // 降价降死的
    return "rookie_dead";                                  // 其他原因倒闭
  }

  // === 爆赚类（5种） ===
  if (ending === "thrive") {
    if (finalState.badReviewRate <= 0.02 && finalState.orderConversion >= 0.30)
      return "speed_demon";                               // 差评超低+下单率超高
    if (profitRate >= 2.0) return "profit_harvester";     // 暴利（赚了2倍以上）
    if (finalState.enterConversion >= 0.18 && finalState.orderConversion >= 0.25)
      return "menu_artist";                               // 双转化率都高=菜单牛逼
    if (totalAdSpend <= 1000 && profit > 0)
      return "cost_miser";                                // 几乎不花钱还赚了
    return "balanced_master";                             // 其他爆赚
  }

  // === 存活类（8种）——大部分人在这里，要足够丰富 ===

  // 先判断极端特征
  if (avgPriceChange <= -10) return "price_killer";       // 疯狂降价
  if (totalAdSpend >= 5000) return "coupon_addict";       // 满减/推广上瘾

  // 口碑相关
  if (finalState.badReviewRate <= 0.02) return "reputation_guard"; // 差评极低
  if (finalState.badReviewRate >= 0.15) return "disaster_magnet";  // 差评爆炸

  // 数据相关
  if (finalState.enterConversion >= 0.16 && finalState.orderConversion >= 0.25)
    return "data_nerd";                                   // 双转化高=懂数据

  // 利润相关
  if (profitRate >= 0.5) return "yolo_boss";              // 中等盈利，敢搏
  if (profitRate > 0 && profitRate < 0.1) return "survivor_king"; // 勉强赚了一点

  // 随机事件运气（看最终曝光变化）
  if (finalState.exposure >= 4000) return "lucky_dog";    // 曝光特别高=运气好
  if (finalState.exposure <= 500) return "disaster_magnet"; // 曝光特别低=运气差

  // 兜底：随机给一个有趣的
  const fallbacks: PlayerTag[] = ["review_beggar", "survivor_king", "data_nerd", "yolo_boss"];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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

  if (profit < -3000) return "血亏！再来一天这样的就要倒闭了";
  if (profit < -1500) return "今天亏得肉疼，方向必须调整";
  if (profit < 0) return "今天在烧钱换增长，小心现金流见底";
  if (avgPriceDelta < -5) return "客单价崩了，你在用底裤换流量";
  if (badReviewRate > 0.10) return "差评炸了！再不管口碑就废了";
  if (badReviewRate > 0.06) return "差评在积累，口碑是外卖的命根";
  if (profit > 3000) return "大赚！今天每个决策都踩对了";
  if (profit > 1500) return "稳中有升，这就是做外卖的正道";
  if (exposure > 500) return "曝光拉起来了，继续优化转化";
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
  if (adRatio > 0.15) {
    trafficScore = 30;
    trafficComment = "推广费占实收超过15%，严重倒挂。所有推广都要和点金比投产比，划算就用不划算就停，没有玄学。";
  } else if (adRatio > 0.08) {
    trafficScore = 50;
    trafficComment = "推广费略高。一般点金花费占实收的2-5%是健康范围。超过8%就该停下来想想了。";
  } else if (finalState.exposure > 3000) {
    trafficScore = 85;
    trafficComment = "流量获取不错。记住：店铺权重越高推广越便宜，持续做好基础功就是在降低获客成本。";
  } else if (finalState.exposure < 800) {
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
  if (enterPct >= 0.18 && orderPct >= 0.28) {
    convScore = 90;
    convComment = "双转化率优秀！入店率和下单率都在高位，同样的流量你能比对手多接很多单。";
  } else if (enterPct >= 0.12 || orderPct >= 0.22) {
    convScore = 70;
    convComment = "转化率不错。继续优化：入店率低改封面图和评分，下单率低改菜单结构和价格。";
  } else if (enterPct < 0.05 || orderPct < 0.08) {
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
  if (avgPriceChange <= -10) {
    costScore = 25;
    costComment = "客单价暴跌！降价超过10元等于每单少赚40%。正确做法：主食微利引流，利润靠福利品赚。福利品应占菜单30%。";
  } else if (avgPriceChange <= -5) {
    costScore = 45;
    costComment = "客单价下滑明显。降价容易涨价难。建议用套餐组合拉客单价，比直接涨价更自然。";
  } else if (avgPriceChange >= 8) {
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
  } else if (profitTrend > 1500) {
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
