"use client";

import { useState, useEffect } from "react";

interface DayStats {
  date: string;
  [key: string]: string | number;
}

interface StatsData {
  daily: DayStats[];
  totals: Record<string, number>;
  days: number;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pwdInput, setPwdInput] = useState("");

  const login = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwdInput }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setAuthed(true);
      } else {
        alert("密码错误");
      }
    } catch {
      alert("登录失败");
    }
  };

  useEffect(() => {
    if (!authed || !token) return;
    setLoading(true);
    fetch("/api/stats?days=30", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authed, token]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 shadow max-w-sm w-full">
          <h1 className="text-lg font-bold mb-4">后台登录</h1>
          <input
            type="password"
            value={pwdInput}
            onChange={(e) => setPwdInput(e.target.value)}
            placeholder="输入管理密码"
            className="w-full px-3 py-2 border rounded-lg mb-3"
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <button
            onClick={login}
            className="w-full bg-black text-white py-2 rounded-lg font-bold"
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  // 核心漏斗指标
  const t = stats.totals;
  const funnel = [
    { label: "页面访问", key: "page_view", emoji: "👀" },
    { label: "点击开始", key: "start_click", emoji: "👆" },
    { label: "开始答题", key: "start_game", emoji: "🎮" },
    { label: "完成游戏", key: "game_end", emoji: "🏁" },
    { label: "查看领奖页", key: "reward_page_view", emoji: "🎁" },
    { label: "排行榜提交", key: "leaderboard_submit", emoji: "🏆" },
    { label: "分享蒙版弹出", key: "share_gate_shown", emoji: "🔒" },
    { label: "邀请成功", key: "invite_scan_success", emoji: "🤝" },
    { label: "再来一局", key: "replay_from_result", emoji: "🔄" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-black mb-1">📊 外卖游戏运营后台</h1>
        <p className="text-sm text-gray-500 mb-4">
          最近 {stats.days} 天数据
        </p>

        {/* 核心漏斗 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-bold mb-3">🔽 转化漏斗（累计）</h2>
          <div className="space-y-2">
            {funnel.map((f, i) => {
              const val = t[f.key] || 0;
              const prev = i > 0 ? t[funnel[i - 1].key] || 0 : val;
              const rate =
                prev > 0 ? ((val / prev) * 100).toFixed(1) : "-";
              const barWidth =
                t["page_view"] > 0
                  ? (val / t["page_view"]) * 100
                  : 0;
              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span>
                      {f.emoji} {f.label}
                    </span>
                    <span className="font-bold">
                      {val}{" "}
                      <span className="text-gray-400 font-normal">
                        ({rate}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${Math.max(barWidth, 1)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 每日明细 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-bold mb-3">📅 每日明细</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1 pr-2">日期</th>
                  <th className="py-1 pr-2">访问</th>
                  <th className="py-1 pr-2">开始</th>
                  <th className="py-1 pr-2">完成</th>
                  <th className="py-1 pr-2">领奖</th>
                  <th className="py-1 pr-2">分享</th>
                  <th className="py-1">邀请</th>
                </tr>
              </thead>
              <tbody>
                {stats.daily
                  .filter((d) => Object.keys(d).length > 1)
                  .map((d) => (
                    <tr
                      key={d.date}
                      className="border-b border-gray-50"
                    >
                      <td className="py-1 pr-2 font-mono">
                        {String(d.date).slice(5)}
                      </td>
                      <td className="py-1 pr-2">
                        {d.page_view || 0}
                      </td>
                      <td className="py-1 pr-2">
                        {d.start_game || d.start_click || 0}
                      </td>
                      <td className="py-1 pr-2">
                        {d.game_end || 0}
                      </td>
                      <td className="py-1 pr-2">
                        {d.reward_page_view || 0}
                      </td>
                      <td className="py-1 pr-2">
                        {d.share_gate_shown || 0}
                      </td>
                      <td className="py-1">
                        {d.invite_scan_success || 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 关键转化率 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-bold mb-3">📈 关键转化率</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "访问→开始",
                from: "page_view",
                to: "start_click",
              },
              {
                label: "开始→完成",
                from: "start_game",
                to: "game_end",
              },
              {
                label: "完成→领奖",
                from: "game_end",
                to: "reward_page_view",
              },
              {
                label: "完成→再玩",
                from: "game_end",
                to: "replay_from_result",
              },
            ].map((r) => {
              const from = t[r.from] || 0;
              const to = t[r.to] || 0;
              const rate =
                from > 0 ? ((to / from) * 100).toFixed(1) : "0";
              return (
                <div
                  key={r.label}
                  className="bg-gray-50 rounded-xl p-3 text-center"
                >
                  <p className="text-[11px] text-gray-500">
                    {r.label}
                  </p>
                  <p className="text-lg font-black">{rate}%</p>
                  <p className="text-[10px] text-gray-400">
                    {to}/{from}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
