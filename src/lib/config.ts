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
      {
        text: "开启满30减5活动",
        effect: { cash: -300, exposure: 30, conversion: 0.02, badReviewRate: 0.01 },
        knowledge: "满减是平台权重最直接的杠杆：参与满减的店铺会进入活动池获得额外曝光，同时下单门槛感降低提升转化。代价是补贴成本和订单密度上升带来的轻微差评。",
      },
      {
        text: "直接降价3元",
        effect: { cash: -200, conversion: 0.03, avgPrice: -3 },
        knowledge: "降价能快速提升转化率（用户决策成本降低），但客单价被永久压低，未来每单都少赚3块，长期毛利受损。曝光不会直接涨。",
      },
      {
        text: "暂时不动，观察一天",
        effect: { exposure: -10 },
        knowledge: "外卖排名算法看的是店铺活跃度和数据趋势，曝光下降时不行动，平台会判断你不活跃，曝光会继续掉。",
      },
    ],
  },
  {
    id: "q002",
    title: "差评率飙到8%",
    desc: "连续几单顾客抱怨出餐慢，差评率开始涨了。",
    options: [
      {
        text: "下午雇小时工支援后厨",
        effect: { cash: -400, badReviewRate: -0.05 },
        knowledge: "外卖差评的最大来源是出餐慢和漏单，加人手是最直接对症的办法。代价是当日人工成本，但能立刻把差评率压下去。",
      },
      {
        text: "关闭高峰期的满减，减单",
        effect: { exposure: -20, badReviewRate: -0.03 },
        knowledge: "通过减少订单密度回到正常出餐节奏，差评会下降；但关闭满减导致活动池权重下降，曝光直接掉。",
      },
      {
        text: "无视，撑过这波再说",
        effect: { badReviewRate: 0.03, conversion: -0.02 },
        knowledge: "差评有雪球效应：差评数越多，新用户在菜单页看到差评就越不敢下单，转化率会被反噬。",
      },
    ],
  },
  {
    id: "q003",
    title: "平台客户经理推广",
    desc: "美团小二打电话说可以上点金推广，每天300预算。",
    options: [
      {
        text: "试一下，上300预算",
        effect: { cash: -300, exposure: 50 },
        knowledge: "点金属于CPC付费曝光，平均每次曝光约6毛钱，300预算大约换来50次有效进店。是性价比最稳的投放试水。",
      },
      {
        text: "砸大一点，上800预算",
        effect: { cash: -800, exposure: 120, conversion: 0.01 },
        knowledge: "高预算能拿到平台优先推荐位，曝光大涨；同时优质流量位带来的用户决策更果断，转化也跟着提升。",
      },
      {
        text: "不上，自然流量够了",
        effect: { exposure: -5 },
        knowledge: "短期省钱，但长期不投广告意味着对自然流量完全依赖，权重会缓慢下滑。",
      },
    ],
  },
  {
    id: "q004",
    title: "竞争对手上了新品",
    desc: "隔壁家突然上了爆款套餐，你的订单明显被抢走。",
    options: [
      {
        text: "跟进上一个更便宜的套餐",
        effect: { cash: -200, conversion: 0.04, avgPrice: -2 },
        knowledge: "用低价跟进能截胡价格敏感用户，转化率提升明显；但客单价被拖低，每单利润缩水。",
      },
      {
        text: "优化菜单把主推产品放首位",
        effect: { conversion: 0.03 },
        knowledge: "外卖80%的用户只看菜单第一屏，调整排序属于零成本动作，能提升转化但效果有限。",
      },
      {
        text: "不管，他那是亏本冲量",
        effect: { exposure: -15, conversion: -0.02 },
        knowledge: "外卖是注意力游戏，对手在抢用户而你不行动，自然流量和转化都会被分走。",
      },
    ],
  },
  {
    id: "q005",
    title: "老客户流失",
    desc: "后台显示复购率下降了，一些老客户30天没回来。",
    options: [
      {
        text: "给老客户发8折召回券",
        effect: { cash: -250, exposure: 20, conversion: 0.02 },
        knowledge: "短信召回+定向优惠券是最直接的复购唤醒，老客回流既贡献订单又能给店铺刷新活跃度，间接拉曝光。",
      },
      {
        text: "升级包装+送小赠品",
        effect: { cash: -350, badReviewRate: -0.02, conversion: 0.02 },
        knowledge: "提升体验感能降低差评同时提升下次回购意愿，是长效投资，但短期成本较高。",
      },
      {
        text: "不处理，新客进的很快",
        effect: { conversion: -0.03 },
        knowledge: "复购率下降会传导到整体转化率：因为老客是复购转化的主力盘，光靠新客是补不回这个窟窿的。",
      },
    ],
  },
  {
    id: "q006",
    title: "高峰期爆单",
    desc: "中午11:30-1:00订单暴涨，后厨快顶不住了。",
    options: [
      {
        text: "限制接单，保质量",
        effect: { exposure: -10, badReviewRate: -0.03 },
        knowledge: "牺牲一部分曝光换准时率，长远口碑稳。平台对自动停单有曝光惩罚但很轻。",
      },
      {
        text: "硬扛，赚钱要紧",
        effect: { cash: 200, badReviewRate: 0.05 },
        knowledge: "短期收入直接到账，但出餐质量和速度下降，差评率会大涨，影响后面几天的转化。",
      },
      {
        text: "临时加钱叫骑手",
        effect: { cash: -300, badReviewRate: -0.02 },
        knowledge: "用钱解决配送瓶颈，比让后厨硬撑更可靠，差评率下降。这是商家版本的'弹性扩容'。",
      },
    ],
  },
  {
    id: "q007",
    title: "食材涨价15%",
    desc: "猪肉和蔬菜最近都涨价，毛利被压缩。",
    options: [
      {
        text: "涨价2块转嫁成本",
        effect: { avgPrice: 2, exposure: -20 },
        knowledge: "成本转嫁的标准动作，但价格变化会触发平台重新计算价格档位，曝光下降。",
      },
      {
        text: "换便宜供应商",
        effect: { badReviewRate: 0.04, cash: 100 },
        knowledge: "便宜原料容易出现品质波动，差评率上涨。短期省钱长期掉口碑。",
      },
      {
        text: "自己扛着，保护回头客",
        effect: { cash: -400 },
        knowledge: "保住客单价和复购率，但烧钱速度加快，需要现金流支撑。",
      },
    ],
  },
  {
    id: "q008",
    title: "店铺评分降到4.3",
    desc: "平台评分跌破4.5，曝光开始受影响。",
    options: [
      {
        text: "主动联系差评用户赔付",
        effect: { cash: -300, badReviewRate: -0.05 },
        knowledge: "平台对差评处理速度有评分加权，主动赔付既能让用户改评论也能给店铺加'服务分'。",
      },
      {
        text: "找人刷好评",
        effect: { cash: -200, badReviewRate: -0.02, exposure: -10 },
        knowledge: "短期评分数字漂亮，但平台风控会识别出异常评价模式并反向降权，曝光下降。",
      },
      {
        text: "优化出品，长远改善",
        effect: { cash: -150, badReviewRate: -0.03, conversion: 0.01 },
        knowledge: "治本路线，差评下降+真实好评积累+转化率轻微上升。但见效慢。",
      },
    ],
  },
  {
    id: "q009",
    title: "周末流量高峰",
    desc: "周六周日订单量明显比工作日多。",
    options: [
      {
        text: "上周末限定套餐拉高客单",
        effect: { cash: -100, avgPrice: 3, conversion: 0.02 },
        knowledge: "针对场景定价能拉高客单且不影响工作日定价，是聪明的'价格分层'策略。",
      },
      {
        text: "加大推广预算抓流量",
        effect: { cash: -500, exposure: 80 },
        knowledge: "高峰期用户决策快、转化高，是投流量的最佳时机，单位曝光性价比最高。",
      },
      {
        text: "维持现状不动",
        effect: {},
        knowledge: "错过周末就是错过一周三分之一的机会，对手在收割你在观望。",
      },
    ],
  },
  {
    id: "q010",
    title: "菜单点击低",
    desc: "后台数据显示80%的用户看完菜单就走了。",
    options: [
      {
        text: "换封面图，换爆款排序",
        effect: { conversion: 0.04 },
        knowledge: "外卖菜单的转化关键在第一屏3秒，封面图决定一切。零成本但效果立竿见影。",
      },
      {
        text: "全部菜品打9折",
        effect: { cash: -200, conversion: 0.03, avgPrice: -2 },
        knowledge: "粗暴但有效。代价是利润和品牌定位，会让用户对原价产生抗性。",
      },
      {
        text: "换个视频做菜单",
        effect: { cash: -500, conversion: 0.05 },
        knowledge: "视频菜单是平台展示权重高的高级动作，用户停留时间增长，转化提升明显。",
      },
    ],
  },
  {
    id: "q011",
    title: "订单量停滞",
    desc: "这几天订单一直卡在一个数字上不去。",
    options: [
      {
        text: "上新品刺激复购",
        effect: { cash: -300, conversion: 0.03, exposure: 20 },
        knowledge: "新品能拉曝光（平台算法偏爱新品上架）+刺激老客尝鲜复购，是双重提升。",
      },
      {
        text: "做大额满减拉新",
        effect: { cash: -500, exposure: 60, avgPrice: -1 },
        knowledge: "通过价格刺激强行突破停滞期，吃利润换增长，需要精准控制满减门槛。",
      },
      {
        text: "重新拍产品图",
        effect: { cash: -200, conversion: 0.02 },
        knowledge: "图片是外卖最重要的视觉资产，专业产品图能显著提升点击-下单转化率。",
      },
    ],
  },
  {
    id: "q012",
    title: "新骑手配送慢",
    desc: "最近平台新骑手多，配送时间明显变长。",
    options: [
      {
        text: "减少配送范围",
        effect: { exposure: -30, badReviewRate: -0.04 },
        knowledge: "缩范围=曝光池缩小，但配送时效大幅改善，差评率下降。",
      },
      {
        text: "提前5分钟出餐",
        effect: { cash: -200, badReviewRate: -0.03 },
        knowledge: "增加出餐人力提前备餐，缓解骑手延误的体验，但会增加废餐成本。",
      },
      {
        text: "订单打包多加保温袋",
        effect: { cash: -150, badReviewRate: -0.02 },
        knowledge: "成本最低的差评抑制方案：保温袋能让用户接到的菜还是热的，但治标不治本。",
      },
    ],
  },
  {
    id: "q013",
    title: "隔壁发小广告",
    desc: "隔壁竞品在发传单抢你的小区用户。",
    options: [
      {
        text: "也发传单反击",
        effect: { cash: -300, exposure: 40 },
        knowledge: "线下流量战，烧钱但能保住小区曝光的基本盘。",
      },
      {
        text: "做社群运营老客户",
        effect: { cash: -200, conversion: 0.04 },
        knowledge: "把流量变成关系，社群里的用户转化率比公域高2-3倍，长效收益。",
      },
      {
        text: "不理会",
        effect: { exposure: -20 },
        knowledge: "对手在你的小区抢用户，不反击就是失地，曝光池被压缩。",
      },
    ],
  },
  {
    id: "q014",
    title: "菜品成本核算错了",
    desc: "会计发现主推菜品其实是亏本卖的。",
    options: [
      {
        text: "立即下架亏损菜",
        effect: { conversion: -0.03, cash: 200 },
        knowledge: "止损最快，但下架的恰恰是引流款，转化率会受冲击。",
      },
      {
        text: "偷偷涨价1元",
        effect: { avgPrice: 1, exposure: -10 },
        knowledge: "用户对小幅涨价相对不敏感，但客单价一变平台会重新评估价格档位，曝光略降。",
      },
      {
        text: "换配方降成本",
        effect: { badReviewRate: 0.03, cash: 300 },
        knowledge: "低价原料配老菜品=口感变化的高发组合，老用户最先察觉，差评上涨。",
      },
    ],
  },
  {
    id: "q015",
    title: "竞品降价促销",
    desc: "隔壁家全线降价20%，你的顾客在流失。",
    options: [
      {
        text: "硬跟，我也降价",
        effect: { avgPrice: -3, cash: -200, conversion: 0.02 },
        knowledge: "价格战是双输局面，但短期能稳住价格敏感用户的转化。",
      },
      {
        text: "做差异化推高端套餐",
        effect: { cash: -300, avgPrice: 5, exposure: -10 },
        knowledge: "差异化是正道，客单价上去了。但短期因为定价升高，价格敏感用户流失，曝光下降。",
      },
      {
        text: "稳住不动",
        effect: { exposure: -30, conversion: -0.02 },
        knowledge: "纯粹挨打：竞品降价时不行动，曝光和转化双跌。",
      },
    ],
  },
  {
    id: "q016",
    title: "出品不稳定",
    desc: "同一道菜今天咸明天淡，有顾客投诉。",
    options: [
      {
        text: "标准化配方+称重",
        effect: { cash: -300, badReviewRate: -0.05 },
        knowledge: "外卖品控的根本：可复制的SOP才能稳定出品，是规模化的前提。",
      },
      {
        text: "换个主厨",
        effect: { cash: -800, badReviewRate: -0.06, conversion: 0.02 },
        knowledge: "成本高但效果立竿见影：好厨师不仅稳口味，菜品好评带动转化。",
      },
      {
        text: "送赠品平复",
        effect: { cash: -200, badReviewRate: -0.02 },
        knowledge: "治标不治本，差评源（口味不稳）没解决，下次还会出现。",
      },
    ],
  },
  {
    id: "q017",
    title: "小区业主群",
    desc: "发现你店所在小区有几个活跃的业主群。",
    options: [
      {
        text: "进群发红包做活动",
        effect: { cash: -300, exposure: 50, conversion: 0.03 },
        knowledge: "本地化精准流量，群里的用户都是潜在3公里复购客户，转化率高。",
      },
      {
        text: "找群主合作推广",
        effect: { cash: -500, exposure: 80 },
        knowledge: "省事但KOL价格高，曝光大但用户对硬广的转化未必好。",
      },
      {
        text: "不理会",
        effect: {},
        knowledge: "白白浪费一个本地高粘性的免费流量池。",
      },
    ],
  },
  {
    id: "q018",
    title: "骑手偷餐",
    desc: "收到一起骑手偷餐投诉，顾客很生气。",
    options: [
      {
        text: "直接补偿顾客全额",
        effect: { cash: -100, badReviewRate: -0.03 },
        knowledge: "客户体验优先，全额赔付能让用户从'极度愤怒'转为'还行'，差评率下降。",
      },
      {
        text: "改用防撕封口贴",
        effect: { cash: -200, badReviewRate: -0.02 },
        knowledge: "技术性堵漏，从源头杜绝问题，长效降差评。",
      },
      {
        text: "让顾客找平台",
        effect: { badReviewRate: 0.04, conversion: -0.01 },
        knowledge: "推卸责任=差评保送+用户拉黑你家店，复购流失。",
      },
    ],
  },
  {
    id: "q019",
    title: "平台扣点上调",
    desc: "平台把佣金从18%上调到21%。",
    options: [
      {
        text: "所有菜品涨2元",
        effect: { avgPrice: 2, exposure: -25 },
        knowledge: "把扣点压力转嫁顾客，但价格敏感度会反映在曝光排名上，平台扣分。",
      },
      {
        text: "精简菜单保利润",
        effect: { conversion: -0.02, cash: 200 },
        knowledge: "砍掉低毛利产品保护整体利润，但菜品减少会影响选择丰富度，转化下降。",
      },
      {
        text: "不变扛着",
        effect: { cash: -400 },
        knowledge: "保住流量但持续烧钱，只能短期撑，需要更大的订单规模摊薄。",
      },
    ],
  },
  {
    id: "q020",
    title: "第7天最后冲刺",
    desc: "最后一天了，要搏一把大的还是稳着收尾？",
    options: [
      {
        text: "all in 推广+满减",
        effect: { cash: -800, exposure: 150, conversion: 0.05, avgPrice: -2 },
        knowledge: "最后一天梭哈策略：高曝光+高转化+低客单，赢了爆赚输了爆亏，搏的是单量。",
      },
      {
        text: "稳着收尾",
        effect: { cash: 100 },
        knowledge: "保住前6天成果，避免翻车。这是稳健派的选择。",
      },
      {
        text: "涨价收割",
        effect: { avgPrice: 4, exposure: -30 },
        knowledge: "客单价短期拉高利润，但流量会瞬间崩塌，赌的是老客忠诚度。",
      },
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
