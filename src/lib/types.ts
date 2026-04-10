// === 外卖老板生存模拟器 v2.0 类型定义 ===

/** 核心经营指标 */
export interface GameState {
  cash: number;            // 现金
  day: number;             // 当前天数（1-7）
  exposure: number;        // 曝光量（每日触达人数）
  enterConversion: number; // 入店转化率 (0-1)
  orderConversion: number; // 下单转化率 (0-1)
  avgPrice: number;        // 客单价
  badReviewRate: number;   // 差评率 (0-1)
}

/** 选项效果：对各项指标的增减 */
export interface OptionEffect {
  cash?: number;
  exposure?: number;
  enterConversion?: number;  // 入店转化率变化
  orderConversion?: number;  // 下单转化率变化
  avgPrice?: number;
  badReviewRate?: number;
}

/** 题目选项 */
export interface SimOption {
  text: string;
  effect: OptionEffect;
  hint?: string;        // 选后的小提示
  knowledge?: string;   // 知识点：为什么会涨/跌这些值
  verdict?: string;     // 闫寒风格的直接判断（如"推荐""饮鸩止渴"）
}

/** 模拟题目 */
export interface SimQuestion {
  id: string;
  title: string;       // 标题，如"曝光下降了20%"
  desc: string;        // 背景描述
  options: SimOption[];
  day?: number;         // 指定第几天出现（1-7），不填则随机
  difficulty?: "basic" | "intermediate" | "advanced";
  realCase?: string;    // 真实案例引用
}

/** 随机事件 */
export interface RandomEvent {
  id: string;
  title: string;
  desc: string;
  effect: OptionEffect;
  emoji: string;
}

/** 玩家选择记录 */
export interface ChoiceRecord {
  questionId: string;
  optionIndex: number;
  day: number;
  effect: OptionEffect;
}

/** 每日决策记录（用于账本回顾） */
export interface DayChoiceLogItem {
  questionTitle: string;
  optionText: string;
  cashDelta: number;
  effects: OptionEffect;
}

/** 每日结算 */
export interface DaySummary {
  day: number;
  incomeRevenue: number;    // 订单收入
  fixedCost: number;        // 固定成本（租金+员工）
  choiceImpact: number;     // 题目现金影响总和
  profit: number;           // 净利润
  cashBefore: number;       // 结算前现金
  cashAfter: number;        // 结算后现金
  exposureEnd: number;
  enterConversionEnd: number;
  orderConversionEnd: number;
  badReviewEnd: number;
  avgPriceEnd: number;
  // 营业额公式分解
  estimatedOrders: number;     // = exposure × enterConv × orderConv × (差评折扣)
  effectiveOrderConv: number;  // 折算差评后的下单转化率
  // 当日决策回顾
  choiceLog: DayChoiceLogItem[];
  comment: string;          // 自动点评
  eventTitle?: string;      // 当天触发的事件
  eventEmoji?: string;
  eventDesc?: string;
}

/** 结局类型 */
export type EndingType =
  | "bankrupt"    // 倒闭
  | "survive"    // 勉强存活
  | "thrive";    // 爆赚

/** 玩家标签（16种人格） */
export type PlayerTag =
  | "price_killer"       // 价格屠夫
  | "traffic_gambler"    // 流量赌徒
  | "profit_harvester"   // 利润收割机
  | "reputation_guard"   // 口碑圣母
  | "balanced_master"    // 六边形战士
  | "rookie_dead"        // 韭菜本菜
  | "coupon_addict"      // 满减上瘾症
  | "data_nerd"          // 数据强迫症
  | "cost_miser"         // 铁公鸡
  | "yolo_boss"          // 梭哈型老板
  | "survivor_king"      // 苟活大师
  | "speed_demon"        // 闪电出餐王
  | "review_beggar"      // 好评乞丐
  | "menu_artist"        // 菜单艺术家
  | "lucky_dog"          // 欧皇附体
  | "disaster_magnet";   // 灾难吸铁石

export interface TagInfo {
  id: PlayerTag;
  label: string;
  emoji: string;
  desc: string;
}

/** 结局信息 */
export interface EndingInfo {
  type: EndingType;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

// === 旧的类型保留，避免破坏引用 ===

export interface ResultLevel {
  title: string;
  minScore: number;
  maxScore: number;
  description: string;
  emoji: string;
}

export type UpgradeCategory =
  | "storefront"
  | "menu"
  | "kitchen"
  | "traffic"
  | "reputation"
  | "member";

export interface UpgradeOption {
  category: UpgradeCategory;
  title: string;
  description: string;
  feedbackText: string;
}

export interface StoreState {
  storefront: number;
  menu: number;
  kitchen: number;
  traffic: number;
  reputation: number;
  member: number;
}

/** 排行榜条目 (v3.2) */
export interface LeaderboardEntry {
  id: string;
  displayName: string;       // 玩家昵称或店铺名
  profit: number;            // 5天净利润
  finalCash: number;         // 最终现金
  daysSurvived: number;      // 存活天数
  ending: EndingType;
  tag: PlayerTag;
  createdAt: number;
}

/** 每日叙事线 */
export interface DayStory {
  day: number;
  title: string;
  emoji: string;
  intro: string;
  mood: string;
}

/** 经营诊断维度 */
export interface DiagnosisDimension {
  id: string;
  name: string;
  score: number;
  comment: string;
}

/** 完整经营诊断报告 */
export interface DiagnosisReport {
  dimensions: DiagnosisDimension[];
  summary: string;
  playerTag: PlayerTag;
}
