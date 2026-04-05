/**
 * 微信 ClawBot 消息发送工具
 * 通过 WeChat IMLink API 发送文本/图片消息
 *
 * 用法：
 *   node scripts/wechat-send.js text "你好"
 *   node scripts/wechat-send.js quiz-invite          # 发送答题邀请
 *   node scripts/wechat-send.js quiz-result 85 王者掌门  # 发送答题结果
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ---- Config ----
const ACCOUNT_FILE = path.join(
  process.env.HOME,
  ".openclaw/openclaw-weixin/accounts/78cc1bf7b5bc-im-bot.json"
);
const CONTEXT_FILE = path.join(
  process.env.HOME,
  ".openclaw/openclaw-weixin/accounts/78cc1bf7b5bc-im-bot.context-tokens.json"
);
const ILINK_APP_ID = "bot";
const ILINK_APP_CLIENT_VERSION = String((2 << 16) | (1 << 8) | 1); // 2.1.1
const QUIZ_URL = "http://121.36.105.43:18899/waimai-game/";

// ---- Load account ----
const account = JSON.parse(fs.readFileSync(ACCOUNT_FILE, "utf-8"));
const BASE_URL = account.baseUrl; // https://ilinkai.weixin.qq.com
const TOKEN = account.token;
const BOT_USER_ID = account.userId;

// Load context tokens (maps wechat userId -> contextToken)
let contextTokens = {};
try {
  contextTokens = JSON.parse(fs.readFileSync(CONTEXT_FILE, "utf-8"));
} catch (e) {}

// The main user to send to (bot owner)
const TARGET_USER = BOT_USER_ID;

// ---- API helpers ----
function randomWechatUin() {
  const uint32 = crypto.randomBytes(4).readUInt32BE(0);
  return Buffer.from(String(uint32), "utf-8").toString("base64");
}

function generateClientId() {
  return `openclaw-weixin-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

async function sendMessage(toUserId, text) {
  const contextToken = contextTokens[toUserId] || "";
  const body = JSON.stringify({
    msg: {
      from_user_id: "",
      to_user_id: toUserId,
      client_id: generateClientId(),
      message_type: 2, // BOT
      message_state: 2, // FINISH
      item_list: [{ type: 1, text_item: { text } }], // TEXT
      context_token: contextToken || undefined,
    },
    base_info: { channel_version: "2.1.1" },
  });

  const headers = {
    "Content-Type": "application/json",
    AuthorizationType: "ilink_bot_token",
    Authorization: `Bearer ${TOKEN}`,
    "Content-Length": String(Buffer.byteLength(body, "utf-8")),
    "X-WECHAT-UIN": randomWechatUin(),
    "iLink-App-Id": ILINK_APP_ID,
    "iLink-App-ClientVersion": ILINK_APP_CLIENT_VERSION,
  };

  const url = `${BASE_URL}/ilink/bot/sendmessage`;
  console.log(`Sending to ${toUserId.substring(0, 15)}...`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  const resText = await res.text();
  if (!res.ok) {
    throw new Error(`sendMessage failed: ${res.status} ${resText}`);
  }
  console.log(`✓ Message sent successfully`);
  return JSON.parse(resText);
}

// ---- Message templates ----
function quizInviteText() {
  return `🎯 外卖经营挑战赛

随机10题，测测你到底是青铜掌柜还是外卖王者。

答题还能升级你的虚拟店铺，从路边摊变成爆单大店！

👉 立即开始：${QUIZ_URL}

完成挑战还有经营福利可以领取。`;
}

function quizResultText(score, rank) {
  return `📊 答题挑战结果

我刚完成了外卖经营挑战赛！

得分：${score}分
段位：${rank}

你能超过我吗？来试试 👇
${QUIZ_URL}`;
}

// ---- Main ----
async function main() {
  const [, , cmd, ...args] = process.argv;

  switch (cmd) {
    case "text":
      await sendMessage(TARGET_USER, args.join(" "));
      break;

    case "quiz-invite":
      await sendMessage(TARGET_USER, quizInviteText());
      break;

    case "quiz-result": {
      const score = args[0] || "80";
      const rank = args[1] || "王者掌门";
      await sendMessage(TARGET_USER, quizResultText(score, rank));
      break;
    }

    case "broadcast": {
      // Send to all known context token holders
      const users = Object.keys(contextTokens);
      console.log(`Broadcasting to ${users.length} users...`);
      for (const userId of users) {
        try {
          await sendMessage(userId, quizInviteText());
        } catch (err) {
          console.error(`Failed for ${userId.substring(0, 15)}...: ${err.message}`);
        }
      }
      break;
    }

    default:
      console.log(`
微信消息发送工具

用法：
  node scripts/wechat-send.js text "消息内容"     发送文本消息
  node scripts/wechat-send.js quiz-invite          发送答题邀请
  node scripts/wechat-send.js quiz-result 85 王者掌门  发送答题结果
  node scripts/wechat-send.js broadcast            向所有用户广播邀请
`);
  }
}

main().catch(console.error);
