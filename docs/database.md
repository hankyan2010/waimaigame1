# 外卖知识答题游戏 - 数据库设计

## 1. activities
活动表

字段：
- id
- slug
- title
- subtitle
- rewardTitle
- rewardDescription
- questionCount
- status
- startsAt
- endsAt
- createdAt
- updatedAt

说明：
用于配置一个答题活动，默认 questionCount = 10。

---

## 2. questions
题目表

字段：
- id
- activityId
- title
- category
- difficulty
- explanation
- score
- status
- createdAt
- updatedAt

说明：
存储知识问答题本体。

---

## 3. question_options
选项表

字段：
- id
- questionId
- label
- sortOrder
- isCorrect
- createdAt
- updatedAt

说明：
每题 4 个选项，isCorrect 标识正确答案。

---

## 4. result_levels
段位表

字段：
- id
- activityId
- title
- minScore
- maxScore
- description
- rewardText
- createdAt
- updatedAt

说明：
用于配置青铜/白银/黄金/王者等分数段位。

---

## 5. participants
参与者表

字段：
- id
- activityId
- sessionId
- source
- totalScore
- resultLevelId
- finishedAt
- createdAt
- updatedAt

说明：
记录一次完整参与行为。

---

## 6. participant_answers
答题记录表

字段：
- id
- participantId
- questionId
- selectedOptionId
- isCorrect
- earnedScore
- answeredAt

说明：
记录每一题的作答情况。

---

## 7. upgrade_choices
升级选择记录表

字段：
- id
- participantId
- questionId
- category
- choiceKey
- levelAfterUpgrade
- createdAt

说明：
记录用户答对题后选择了哪条升级路线。

---

## 8. rewards / leads
奖励与留资表

字段：
- id
- participantId
- name
- phone
- wechat
- rewardType
- status
- createdAt
- updatedAt

说明：
用于承接加微、留资、领奖。

---

## 9. store_visual_snapshots（可选）
店铺状态快照表

字段：
- id
- participantId
- storefrontLevel
- menuLevel
- kitchenLevel
- trafficLevel
- reputationLevel
- memberLevel
- createdAt

说明：
可用于恢复结果页店铺状态，也方便后期做分享海报。

---

## 分类建议
questions.category 可选值：
- traffic
- conversion
- ticket
- retention
- campaign
- menu
- reputation
- kitchen

---

## 难度建议
questions.difficulty 可选值：
- easy
- medium
- hard

---

## 状态建议
通用 status：
- draft
- active
- archived
- disabled
