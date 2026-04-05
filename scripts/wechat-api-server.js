/**
 * 微信消息发送 API 服务
 * 部署在华为云服务器上，接收来自 H5 页面的请求并通过 ClawBot 发送微信消息
 *
 * 端口：18901
 * 接口：
 *   POST /send-text  { text: string }
 *   POST /send-quiz-invite
 *   POST /send-quiz-result  { score: number, rank: string }
 */

const http = require("http");
const crypto = require("crypto");

// ---- ClawBot Config ----
const BASE_URL = "https://ilinkai.weixin.qq.com";
const TOKEN = "78cc1bf7b5bc@im.bot:060000e5acb57d965f7df51dedfb31455107cc";
const BOT_USER_ID = "o9cq80zqkS6GwMFOH9QwnXq9-J40@im.wechat";
const CONTEXT_TOKEN = "AARzJWAFAAABAAAAAADHROBZuYV6jzHakmXKaSAAAAB+9905Q6UiugPBawU3n3cyzQX+LkN8ofRzsCZYN0mt7tD5Pz4j0PZz25Ou3ad61Fye1qWPlDiK9aotbFWHwIXQxcy8WPOt";
const QUIZ_URL = "http://121.36.105.43:18899/waimai-game/";
const PORT = 18901;

function randomWechatUin() {
  return Buffer.from(String(crypto.randomBytes(4).readUInt32BE(0)), "utf-8").toString("base64");
}

function generateClientId() {
  return `waimai-quiz-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

async function sendWechatMessage(toUserId, text) {
  const body = JSON.stringify({
    msg: {
      from_user_id: "",
      to_user_id: toUserId,
      client_id: generateClientId(),
      message_type: 2,
      message_state: 2,
      item_list: [{ type: 1, text_item: { text } }],
      context_token: CONTEXT_TOKEN || undefined,
    },
    base_info: { channel_version: "2.1.1" },
  });

  const res = await fetch(`${BASE_URL}/ilink/bot/sendmessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AuthorizationType: "ilink_bot_token",
      Authorization: `Bearer ${TOKEN}`,
      "Content-Length": String(Buffer.byteLength(body, "utf-8")),
      "X-WECHAT-UIN": randomWechatUin(),
      "iLink-App-Id": "bot",
      "iLink-App-ClientVersion": "131329",
    },
    body,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`sendMessage failed: ${res.status} ${t}`);
  }
  return await res.json();
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(e); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await parseBody(req);

    if (req.url === "/send-text") {
      await sendWechatMessage(BOT_USER_ID, body.text || "test");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));

    } else if (req.url === "/send-quiz-invite") {
      const text = `🎯 外卖经营挑战赛\n\n随机10题，测测你到底是青铜掌柜还是外卖王者。\n\n答题还能升级你的虚拟店铺，从路边摊变成爆单大店！\n\n👉 立即开始：${QUIZ_URL}\n\n完成挑战还有经营福利可以领取。`;
      await sendWechatMessage(BOT_USER_ID, text);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));

    } else if (req.url === "/send-quiz-result") {
      const { score = 0, rank = "青铜掌柜", userName = "一位老板" } = body;
      const text = `📊 ${userName}刚完成了外卖经营挑战赛！\n\n得分：${score}分\n段位：${rank}\n\n你能超过TA吗？来试试 👇\n${QUIZ_URL}`;
      await sendWechatMessage(BOT_USER_ID, text);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));

    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`WeChat API server running on port ${PORT}`);
});
