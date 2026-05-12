// PRD-11 US-011 · AccountListFilters — 4 dropdowns + debounce 300ms search
// AC-6: industry/platform/level/stage multi-dropdown + debounce 300ms

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AccountFilterState {
  search: string;
  industryFilter: string;
  platformFilter: string;
  levelFilter: string;
  stageFilter: string;
  sortBy: 'createdAt' | 'updatedAt' | 'name';
  sortDir: 'asc' | 'desc';
}

interface AccountListFiltersProps {
  value: AccountFilterState;
  onChange: (f: AccountFilterState) => void;
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '5px 8px',
  fontSize: 12,
  cursor: 'pointer',
  outline: 'none',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '5px 10px',
  fontSize: 12,
  outline: 'none',
  width: 200,
};

const INDUSTRIES = ['', '美妆', '美食', '旅游', '健康', '教育', '科技', '时尚', '游戏', '生活'];
const PLATFORMS = ['', '小红书', '抖音', 'B站', '微博', '微信公众号', '知乎'];
const LEVELS = ['', 'L1', 'L2', 'L3', 'L4', 'L5'];
const STAGES = ['', 'starter', 'growing', 'mature', 'expert'];
const SORT_OPTIONS: Array<{ value: AccountFilterState['sortBy']; label: string }> = [
  { value: 'createdAt', label: '注册时间' },
  { value: 'updatedAt', label: '最近更新' },
  { value: 'name', label: '账号名' },
];

export function AccountListFilters({ value, onChange }: AccountListFiltersProps) {
  const [localSearch, setLocalSearch] = useState(value.search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(value.search);
  }, [value.search]);

  const handleSearchChange = useCallback(
    (s: string) => {
      setLocalSearch(s);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange({ ...value, search: s });
      }, 300);
    },
    [value, onChange],
  );

  const set = useCallback(
    (patch: Partial<AccountFilterState>) => onChange({ ...value, ...patch }),
    [value, onChange],
  );

  const hasFilters =
    value.search ||
    value.industryFilter ||
    value.platformFilter ||
    value.levelFilter ||
    value.stageFilter;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
      <input
        style={inputStyle}
        placeholder="搜索账号名 / 用户邮箱…"
        value={localSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      <select
        style={selectStyle}
        value={value.industryFilter}
        onChange={(e) => set({ industryFilter: e.target.value })}
      >
        <option value="">行业 · 全部</option>
        {INDUSTRIES.filter(Boolean).map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.platformFilter}
        onChange={(e) => set({ platformFilter: e.target.value })}
      >
        <option value="">平台 · 全部</option>
        {PLATFORMS.filter(Boolean).map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.levelFilter}
        onChange={(e) => set({ levelFilter: e.target.value })}
      >
        <option value="">等级 · 全部</option>
        {LEVELS.filter(Boolean).map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.stageFilter}
        onChange={(e) => set({ stageFilter: e.target.value })}
      >
        <option value="">阶段 · 全部</option>
        {STAGES.filter(Boolean).map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.sortBy}
        onChange={(e) => set({ sortBy: e.target.value as AccountFilterState['sortBy'] })}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.sortDir}
        onChange={(e) => set({ sortDir: e.target.value as 'asc' | 'desc' })}
      >
        <option value="desc">↓ 降序</option>
        <option value="asc">↑ 升序</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              search: '',
              industryFilter: '',
              platformFilter: '',
              levelFilter: '',
              stageFilter: '',
            })
          }
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '5px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
