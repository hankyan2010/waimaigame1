const WECHAT_PROXY = "http://121.36.105.43:18902/bot";
const TOKEN = "78cc1bf7b5bc@im.bot:060000e5acb57d965f7df51dedfb31455107cc";
const BOT_USER_ID = "o9cq80zqkS6GwMFOH9QwnXq9-J40@im.wechat";
const CONTEXT_TOKEN = "AARzJWAFAAABAAAAAADHROBZuYV6jzHakmXKaSAAAAB+9905Q6UiugPBawU3n3cyzQX+LkN8ofRzsCZYN0mt7tD5Pz4j0PZz25Ou3ad61Fye1qWPlDiK9aotbFWHwIXQxcy8WPOt";
const QUIZ_URL = "http://waimaiketang.com/game/";

function randomUin(): string {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const num = (arr[0] << 24) | (arr[1] << 16) | (arr[2] << 8) | arr[3];
  return btoa(String(Math.abs(num)));
}

function clientId(): string {
  return `waimai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sendToWechat(text: string): Promise<boolean> {
  try {
    const body = JSON.stringify({
      msg: {
        from_user_id: "",
        to_user_id: BOT_USER_ID,
        client_id: clientId(),
        message_type: 2,
        message_state: 2,
        item_list: [{ type: 1, text_item: { text } }],
        context_token: CONTEXT_TOKEN,
      },
      base_info: { channel_version: "2.1.1" },
    });

    const res = await fetch(`${WECHAT_PROXY}/sendmessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AuthorizationType: "ilink_bot_token",
        Authorization: `Bearer ${TOKEN}`,
        "X-WECHAT-UIN": randomUin(),
        "iLink-App-Id": "bot",
        "iLink-App-ClientVersion": "131329",
      },
      body,
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function sendQuizResult(score: number, rank: string): Promise<boolean> {
  const text = `📊 有人刚完成了外卖经营挑战赛！\n\n得分：${score}分\n段位：${rank}\n\n你能超过TA吗？来试试 👇\n${QUIZ_URL}`;
  return sendToWechat(text);
}

export async function sendQuizInvite(): Promise<boolean> {
  const text = `🎯 外卖经营挑战赛\n\n随机10题，测测你到底是青铜掌柜还是外卖王者。\n答题还能升级你的虚拟店铺，从路边摊变成爆单大店！\n\n👉 立即开始：${QUIZ_URL}`;
  return sendToWechat(text);
}
