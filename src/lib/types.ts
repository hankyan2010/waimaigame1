// === 外卖老板生存模拟器 v2.0 类型定义 ===

/** 核心经营指标 */
export interface GameState {
  cash: number;          // 现金
  day: number;           // 当前天数（1-7）
  exposure: number;      // 曝光量
  conversion: number;    // 转化率 (0-1)
  avgPrice: number;      // 客单价
  badReviewRate: number; // 差评率 (0-1)
}

/** 选项效果：对各项指标的增减 */
export interface OptionEffect {
  cash?: number;
  exposure?: number;
  conversion?: number;
  avgPrice?: number;
  badReviewRate?: number;
}

/** 题目选项 */
export interface SimOption {
  text: string;
  effect: OptionEffect;
  hint?: string;        // 选后的小提示
  knowledge?: string;   // 知识点：为什么会涨/跌这些值
}

/** 模拟题目 */
export interface SimQuestion {
  id: string;
  title: string;       // 标题，如"曝光下降了20%"
  desc: string;        // 背景描述
  options: SimOption[];
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
  incomeRevenue: number;  // 订单收入
  fixedCost: number;      // 固定成本（租金+员工）
  choiceImpact: number;   // 题目现金影响总和
  profit: number;         // 净利润
  cashBefore: number;     // 结算前现金
  cashAfter: number;      // 结算后现金
  exposureEnd: number;
  conversionEnd: number;
  badReviewEnd: number;
  avgPriceEnd: number;
  // 营业额公式分解
  estimatedOrders: number;        // = exposure × 有效转化率
  effectiveConversion: number;    // 折算差评后的转化率
  // 当日决策回顾
  choiceLog: DayChoiceLogItem[];
  comment: string;        // 自动点评
  eventTitle?: string;    // 当天触发的事件
  eventEmoji?: string;
  eventDesc?: string;
}

/** 结局类型 */
export type EndingType =
  | "bankrupt"    // 倒闭
  | "survive"    // 勉强存活
  | "thrive";    // 爆赚

/** 玩家标签 */
export type PlayerTag =
  | "price_killer"     // 价格屠夫
  | "traffic_gambler"  // 流量赌徒
  | "profit_harvester" // 利润收割
  | "reputation_guard" // 口碑守护
  | "rookie_dead"      // 外卖小白（已倒闭）
  | "balanced_master"; // 均衡派

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

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  bestScore: number;       // 改为：最高一次的赚钱数
  bestCorrectCount: number; // 改为：最高一次的存活天数
  highestTier: string;      // 改为：最高结局类型
  createdAt: number;
  updatedAt: number;
}
