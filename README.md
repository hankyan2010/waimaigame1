# 外卖经营知识答题挑战

面向餐饮/外卖老板的手机端 H5 知识问答型互动增长工具。

## 核心功能

- **随机10题答题**：从200题题库中随机抽取10道单选题
- **标准答案判分**：每题10分，满分100分
- **段位评定**：青铜掌柜 / 白银店长 / 黄金操盘手 / 王者掌门
- **店铺升级养成**：答对后3选1升级，6大经营维度（门头/菜单/后厨/流量/口碑/会员）
- **结果页**：总分 + 段位 + 点评 + 店铺成长全景
- **领奖页**：福利承接 + 二维码引导

## 技术栈

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Zustand（状态管理）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 构建
npm run build

# 启动生产环境
npm start
```

开发环境启动后，在浏览器中打开 http://localhost:3000，建议使用手机模拟器查看。

## 项目结构

```
src/
├── app/
│   ├── page.tsx          # 首页
│   ├── play/page.tsx     # 答题页
│   ├── result/page.tsx   # 结果页
│   └── reward/page.tsx   # 领奖页
├── components/
│   ├── quiz/
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionCard.tsx
│   │   └── WrongAnswer.tsx
│   └── upgrade/
│       ├── UpgradeModal.tsx
│       └── StoreView.tsx
├── data/
│   └── questions.ts      # 200题结构化数据
└── lib/
    ├── types.ts           # 类型定义
    ├── config.ts          # 段位/升级配置
    └── store.ts           # Zustand 游戏状态
```

## 视觉风格

采用美团官方配��逻辑：
- 品牌黄 `#FFD100`
- 标题黑 `#111111`
- 正文灰 `#333333`
- 页面底色 `#F7F7F7`

## 题库

题库来源于 `data/question-bank-200.md`，通过 `scripts/parse-questions.js` 脚本转换为结构化 TypeScript 数据。

如需更新题库：
```bash
# 编辑 data/question-bank-200.md
# 然后重新生成
node scripts/parse-questions.js
```

## 配置说明

- **段位配置**：`src/lib/config.ts` 中的 `RESULT_LEVELS`
- **升级选项**：`src/lib/config.ts` 中的 `UPGRADE_POOL`
- **题目数量**：`src/lib/config.ts` 中的 `GAME_CONFIG.questionCount`
