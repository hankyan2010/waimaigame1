"use client";

import { useState, useEffect, useCallback } from "react";

const API = "/api";

interface Question {
  id: number;
  title: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation: string;
  category: string;
  difficulty: string;
  score: number;
}

interface DayStat {
  date: string;
  page_view?: number;
  start_game?: number;
  complete_game?: number;
  share_poster?: number;
  share_confirm?: number;
  avg_score?: number;
  games?: number;
}

const CATEGORIES = ["traffic", "reputation", "kitchen", "ticket", "retention", "location", "campaign", "strategy"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const CAT_LABELS: Record<string, string> = {
  traffic: "流量", reputation: "口碑", kitchen: "后厨", ticket: "客单价",
  retention: "复购", location: "选址", campaign: "营销", strategy: "经营",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"questions" | "stats">("questions");

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [editing, setEditing] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<{ daily: DayStat[]; totals: Record<string, number> } | null>(null);
  const [statDays, setStatDays] = useState(7);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Login
  async function handleLogin() {
    try {
      const res = await fetch(`${API}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setLoginError("");
      } else {
        setLoginError("密码错误");
      }
    } catch {
      setLoginError("连接失败");
    }
  }

  // Load questions
  const loadQuestions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/questions`, { headers: headers() });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [token, headers]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/stats?days=${statDays}`, { headers: headers() });
      const data = await res.json();
      setStats(data);
    } catch { /* ignore */ }
  }, [token, statDays, headers]);

  useEffect(() => {
    if (token && tab === "questions") loadQuestions();
    if (token && tab === "stats") loadStats();
  }, [token, tab, loadQuestions, loadStats]);

  // Save question
  async function saveQuestion(q: Question) {
    const isNew = !q.id;
    const url = isNew ? `${API}/questions` : `${API}/questions/${q.id}`;
    const method = isNew ? "POST" : "PUT";
    await fetch(url, { method, headers: headers(), body: JSON.stringify(q) });
    setEditing(null);
    loadQuestions();
  }

  // Delete question
  async function deleteQuestion(id: number) {
    if (!confirm("确定删除这道题？")) return;
    await fetch(`${API}/questions/${id}`, { method: "DELETE", headers: headers() });
    loadQuestions();
  }

  // Filter questions
  const filtered = questions.filter((q) => {
    if (search && !q.title.includes(search) && !q.explanation.includes(search)) return false;
    if (filterCat && q.category !== filterCat) return false;
    if (filterDiff && q.difficulty !== filterDiff) return false;
    return true;
  });

  // --- LOGIN SCREEN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-lg">
          <h1 className="text-xl font-black text-center mb-4">后台管理</h1>
          <input
            type="password"
            placeholder="输入管理密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-3 text-sm"
          />
          {loginError && <p className="text-red-500 text-xs mb-2">{loginError}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl"
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN ---
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-black">答题游戏后台</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("questions")}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${tab === "questions" ? "bg-yellow-400 text-black" : "bg-gray-100 text-gray-500"}`}
          >
            题库管理
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${tab === "stats" ? "bg-yellow-400 text-black" : "bg-gray-100 text-gray-500"}`}
          >
            数据统计
          </button>
        </div>
      </div>

      {tab === "questions" ? (
        <div className="p-4">
          {/* Summary */}
          <div className="bg-white rounded-xl p-3 mb-3 flex flex-wrap gap-2 text-xs">
            <span className="font-bold">共 {questions.length} 题</span>
            {CATEGORIES.map((c) => {
              const count = questions.filter((q) => q.category === c).length;
              return count > 0 ? (
                <span key={c} className="bg-gray-100 px-2 py-0.5 rounded">{CAT_LABELS[c]} {count}</span>
              ) : null;
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <input
              placeholder="搜索题目..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="px-2 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">全部分类</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
            <select
              value={filterDiff}
              onChange={(e) => setFilterDiff(e.target.value)}
              className="px-2 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">全部难度</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Add button */}
          <button
            onClick={() => setEditing({
              id: 0, title: "", options: [
                { label: "A", text: "", isCorrect: true },
                { label: "B", text: "", isCorrect: false },
                { label: "C", text: "", isCorrect: false },
                { label: "D", text: "", isCorrect: false },
              ], explanation: "", category: "traffic", difficulty: "easy", score: 10,
            })}
            className="w-full py-2 bg-yellow-400 text-black text-sm font-bold rounded-lg mb-3"
          >
            + 新增题目
          </button>

          {/* Question list */}
          {loading ? (
            <p className="text-center text-gray-400 py-8">加载中...</p>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map((q) => (
                <div key={q.id} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">{q.id}. {q.title}</p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">{CAT_LABELS[q.category] || q.category}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{q.difficulty}</span>
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {q.options.find((o) => o.isCorrect)?.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing({ ...q })} className="text-xs text-blue-500 px-2 py-1">编辑</button>
                      <button onClick={() => deleteQuestion(q.id)} className="text-xs text-red-400 px-2 py-1">删除</button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length > 50 && (
                <p className="text-center text-gray-400 text-xs py-2">显示前 50 条，共 {filtered.length} 条</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STATS TAB */
        <div className="p-4">
          {/* Period selector */}
          <div className="flex gap-2 mb-3">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setStatDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ${statDays === d ? "bg-yellow-400 text-black" : "bg-white text-gray-500"}`}
              >
                {d === 1 ? "今日" : d === 7 ? "近7天" : "近30天"}
              </button>
            ))}
          </div>

          {stats ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: "页面访问", key: "page_view", color: "blue" },
                  { label: "开始答题", key: "start_game", color: "green" },
                  { label: "完成答题", key: "complete_game", color: "yellow" },
                  { label: "打开海报", key: "share_poster", color: "purple" },
                  { label: "确认分享", key: "share_confirm", color: "orange" },
                ].map((kpi) => (
                  <div key={kpi.key} className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                    <p className="text-2xl font-black text-gray-800">{stats.totals[kpi.key] || 0}</p>
                  </div>
                ))}
                {/* Conversion rates */}
                <div className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">完成率</p>
                  <p className="text-2xl font-black text-gray-800">
                    {stats.totals.start_game
                      ? Math.round(((stats.totals.complete_game || 0) / stats.totals.start_game) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Daily breakdown */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-2">每日明细</p>
                <div className="space-y-1">
                  <div className="grid grid-cols-6 gap-1 text-[10px] text-gray-400 font-bold pb-1 border-b">
                    <span>日期</span>
                    <span>访问</span>
                    <span>开始</span>
                    <span>完成</span>
                    <span>海报</span>
                    <span>分享</span>
                  </div>
                  {stats.daily.map((d) => (
                    <div key={d.date} className="grid grid-cols-6 gap-1 text-xs text-gray-600">
                      <span>{d.date.slice(5)}</span>
                      <span>{d.page_view || 0}</span>
                      <span>{d.start_game || 0}</span>
                      <span>{d.complete_game || 0}</span>
                      <span>{d.share_poster || 0}</span>
                      <span>{d.share_confirm || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-8">加载中...</p>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          question={editing}
          onSave={saveQuestion}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// --- Edit Modal ---
function EditModal({ question, onSave, onClose }: {
  question: Question;
  onSave: (q: Question) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState<Question>(question);

  function updateOption(idx: number, field: string, value: string | boolean) {
    const opts = [...q.options];
    if (field === "isCorrect") {
      opts.forEach((o, i) => (o.isCorrect = i === idx));
    } else {
      (opts[idx] as any)[field] = value;
    }
    setQ({ ...q, options: opts });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">{q.id ? `编辑 #${q.id}` : "新增题目"}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">x</button>
        </div>

        {/* Title */}
        <label className="text-xs text-gray-500 mb-1 block">题目</label>
        <textarea
          value={q.title}
          onChange={(e) => setQ({ ...q, title: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
        />

        {/* Options */}
        <label className="text-xs text-gray-500 mb-1 block">选项（点击圆圈设置正确答案）</label>
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <button
              onClick={() => updateOption(i, "isCorrect", true)}
              className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center text-xs ${
                opt.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
              }`}
            >
              {opt.label}
            </button>
            <input
              value={opt.text}
              onChange={(e) => updateOption(i, "text", e.target.value)}
              placeholder={`选项 ${opt.label}`}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        ))}

        {/* Explanation */}
        <label className="text-xs text-gray-500 mb-1 block mt-2">解析</label>
        <textarea
          value={q.explanation}
          onChange={(e) => setQ({ ...q, explanation: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
        />

        {/* Category & Difficulty */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">分类</label>
            <select
              value={q.category}
              onChange={(e) => setQ({ ...q, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">难度</label>
            <select
              value={q.difficulty}
              onChange={(e) => setQ({ ...q, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-500">取消</button>
          <button
            onClick={() => onSave(q)}
            className="flex-1 py-3 bg-yellow-400 text-black font-bold rounded-xl text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
