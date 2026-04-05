# 外卖知识答题游戏 - 架构方案

## 一、目标
本项目是一个面向餐饮/外卖老板的知识问答型互动增长工具。

核心目标：
1. 前台完成随机 10 题知识答题挑战
2. 答题过程中叠加店铺升级动画
3. 最终输出分数、段位、奖励承接
4. 后台支持题库、活动、段位、参与记录管理

---

## 二、推荐技术栈

### 前端
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### 后端
- Next.js Route Handlers
- Server Actions（可选）

### 数据层
- PostgreSQL
- Prisma

### 部署
- Vercel / Railway / Docker 均可

---

## 三、项目目录建议

```txt
projects/waimai-quiz-game/
  app/
    (public)/
      activity/[slug]/
      activity/[slug]/result/
      activity/[slug]/reward/
    admin/
      activities/
      questions/
      levels/
      participants/
  components/
    quiz/
    upgrade/
    result/
    admin/
    ui/
  lib/
    db/
    utils/
    quiz/
    upgrade/
  server/
    services/
    repositories/
    validators/
  prisma/
    schema.prisma
  docs/
    architecture.md
    pages.md
    database.md
  data/
    seed-questions.json
  PRD.md
  PROJECT-BRIEF.md
  STORE-UPGRADE-ANIMATION.md
  CLAUDE-CODE-DEVELOPMENT-PROMPT.md
```

---

## 四、模块划分

### 1. Public Quiz Module
负责：
- 活动首页
- 答题流程
- 判分
- 升级选择
- 结果页
- 领奖页

### 2. Upgrade Animation Module
负责：
- 店铺主画面
- 升级项展示
- 升级后状态变化
- 最终店铺形态渲染

### 3. Admin Module
负责：
- 活动管理
- 题库管理
- 段位管理
- 参与记录
- 基础统计

### 4. Quiz Engine Module
负责：
- 随机抽题
- 判题
- 计分
- 结果计算
- 升级机会判定

### 5. Persistence Module
负责：
- 题目存储
- 用户答题记录
- 得分结果
- 升级路径记录

---

## 五、核心数据流

### 前台流程
1. 用户进入活动页
2. 系统读取活动配置
3. 系统随机抽取 10 题
4. 用户逐题作答
5. 答题结果实时记录
6. 答对则触发升级选择
7. 记录升级路径
8. 10 题结束后计算总分与段位
9. 输出结果页与奖励页

### 后台流程
1. 运营创建活动
2. 配置活动标题、抽题数、题库范围
3. 管理题库
4. 配置段位区间和文案
5. 查看参与记录与统计

---

## 六、核心设计原则

### 1. 前台移动端优先
- 一屏一题
- 大按钮
- 高可读性

### 2. 前台视觉统一
- 美团官方配色逻辑
- 黄黑白体系
- 官方活动页感

### 3. 后台优先高效维护
- 列表清晰
- 表单直接
- 编辑高效

### 4. 升级系统配置化
不要把升级逻辑写死在页面里。
建议把升级项、升级阶段、可视元素变化做成配置结构。

---

## 七、升级系统结构建议

### upgrade_categories
- storefront
- menu
- kitchen
- traffic
- reputation
- member

### upgrade_choice
每答对一题，系统给出 3 个可选升级项：
- 升级方向
- 升级名称
- 升级文案
- 影响的视觉层
- 升级后的状态值

### store_visual_state
用于记录当前店铺成长状态，例如：
- storefrontLevel
- menuLevel
- kitchenLevel
- trafficLevel
- reputationLevel
- memberLevel

最终店铺画面根据这些 level 组合渲染。

---

## 八、MVP 开发顺序

### 阶段 1：项目骨架
- 初始化 Next.js + Prisma
- 基础 UI 和 layout
- 数据库初始化

### 阶段 2：题库与后台
- 活动管理
- 题库管理
- 段位管理

### 阶段 3：前台答题主链路
- 首页
- 随机 10 题
- 判题与计分
- 结果页

### 阶段 4：升级动画
- 店铺主画面
- 答对后升级选择
- 升级状态记录
- 最终形态展示

### 阶段 5：记录与统计
- 参与记录
- 答题记录
- 升级路径记录
- 基础统计

---

## 九、风险点

### 1. 把产品做成问卷
规避：
- 所有题目必须有正确答案
- 页面语言要像挑战，不像调查

### 2. 升级系统过复杂
规避：
- MVP 先做 6 大模块 + level 升级
- 不做复杂自由建造

### 3. 视觉跑偏
规避：
- 明确使用美团黄黑白
- 不走土味游戏风

### 4. 题库管理难维护
规避：
- 后台题目字段标准化
- 分类、难度、解析、分值结构固定

---

## 十、结论
这套架构适合先快速做出 MVP，再继续扩展：
- 更多题库
- 更多活动主题
- 更丰富的升级分支
- 分享海报
- 排行榜/社交玩法
