// PRD-11 US-007 · Multi-dimensional filters + debounce search (300ms)

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FilterState {
  search: string;
  roleFilter: string;
  planFilter: string;
  industryFilter: string;
  sortBy: 'createdAt' | 'lastLoginAt' | 'email' | 'name';
  sortDir: 'asc' | 'desc';
}

interface UserListFiltersProps {
  value: FilterState;
  onChange: (f: FilterState) => void;
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
  width: 220,
};

const ROLES = ['', 'user', 'admin', 'super_admin'];
const PLANS = ['', 'free', 'pro', 'enterprise'];
const INDUSTRIES = ['', '美妆', '美食', '旅游', '健康', '教育', '科技', '时尚', '游戏'];
const SORT_OPTIONS: Array<{ value: FilterState['sortBy']; label: string }> = [
  { value: 'createdAt', label: '注册时间' },
  { value: 'lastLoginAt', label: '最近登录' },
  { value: 'email', label: '邮箱' },
  { value: 'name', label: '昵称' },
];

export function UserListFilters({ value, onChange }: UserListFiltersProps) {
  const [localSearch, setLocalSearch] = useState(value.search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external search to local when reset externally
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
    (patch: Partial<FilterState>) => onChange({ ...value, ...patch }),
    [value, onChange],
  );

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
      <input
        style={inputStyle}
        placeholder="搜索 email / 昵称…"
        value={localSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      <select
        style={selectStyle}
        value={value.roleFilter}
        onChange={(e) => set({ roleFilter: e.target.value })}
      >
        <option value="">角色 · 全部</option>
        {ROLES.filter(Boolean).map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.planFilter}
        onChange={(e) => set({ planFilter: e.target.value })}
      >
        <option value="">套餐 · 全部</option>
        {PLANS.filter(Boolean).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.industryFilter}
        onChange={(e) => set({ industryFilter: e.target.value })}
      >
        <option value="">行业 · 全部</option>
        {INDUSTRIES.filter(Boolean).map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={value.sortBy}
        onChange={(e) => set({ sortBy: e.target.value as FilterState['sortBy'] })}
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

      {(value.search || value.roleFilter || value.planFilter || value.industryFilter) && (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              search: '',
              roleFilter: '',
              planFilter: '',
              industryFilter: '',
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
