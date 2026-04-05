"use client";

import { useState } from "react";

interface DisplayNameInputProps {
  onSubmit: (name: string) => void;
  currentName?: string;
  canEdit?: boolean;
}

export function DisplayNameInput({ onSubmit, currentName, canEdit = true }: DisplayNameInputProps) {
  const [name, setName] = useState(currentName || "");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("至少输入 2 个字符");
      return;
    }
    if (trimmed.length > 20) {
      setError("最多 20 个字符");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  if (!canEdit && currentName) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🏆</span>
            <span className="text-sm font-bold text-title">{currentName}</span>
          </div>
          <span className="text-[10px] text-secondary bg-bg px-2 py-0.5 rounded-full">已参与排行</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🏆</span>
        <p className="text-xs font-bold text-title">参与老板排行榜</p>
      </div>
      <p className="text-[11px] text-secondary mb-3">
        输入你的店名 / 品牌名 / 人名，看看你在老板圈里能排第几
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：王哥烧烤、蒜头外卖、张老板"
          maxLength={20}
          className="flex-1 px-3 py-2.5 text-sm bg-bg rounded-xl border border-border focus:border-brand focus:outline-none text-title placeholder:text-secondary/50"
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2.5 bg-brand text-title text-sm font-bold rounded-xl shrink-0 active:scale-[0.98] transition-transform"
        >
          {currentName ? "修改" : "提交"}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-error mt-1.5">{error}</p>
      )}
    </div>
  );
}
