// PRD-12 US-005 · ReviewTrendingFilters
// status / platform(5 platforms) / autoVerdict / dateRange · debounce 300ms

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TrendingFilterState {
  statusFilter: string;
  platformFilter: string;
  autoVerdictFilter: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  value: TrendingFilterState;
  onChange: (f: TrendingFilterState) => void;
  hideStatus?: boolean;
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
  padding: '5px 8px',
  fontSize: 12,
  outline: 'none',
};

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已驳回' },
  { value: 'auto_approved', label: '自动批准' },
  { value: 'auto_rejected', label: '自动驳回' },
];

const PLATFORM_OPTIONS = [
  { value: '', label: '全部平台' },
  { value: 'douyin', label: '抖音' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'bilibili', label: 'B站' },
  { value: 'weibo', label: '微博' },
  { value: 'kuaishou', label: '快手' },
];

const AUTO_VERDICT_OPTIONS = [
  { value: '', label: '全部判定' },
  { value: 'auto_approved', label: '自动批准' },
  { value: 'auto_rejected', label: '自动驳回' },
  { value: 'needs_review', label: '需人工审核' },
];

export function ReviewTrendingFilters({ value, onChange, hideStatus }: Props) {
  const [localDateFrom, setLocalDateFrom] = useState(value.dateFrom);
  const [localDateTo, setLocalDateTo] = useState(value.dateTo);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalDateFrom(value.dateFrom);
    setLocalDateTo(value.dateTo);
  }, [value.dateFrom, value.dateTo]);

  const handleDateChange = useCallback(
    (field: 'dateFrom' | 'dateTo', val: string) => {
      if (field === 'dateFrom') setLocalDateFrom(val);
      else setLocalDateTo(val);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange({ ...value, [field]: val });
      }, 300);
    },
    [value, onChange],
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 12,
        padding: '10px 12px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
      }}
    >
      {!hideStatus && (
        <select
          value={value.statusFilter}
          onChange={(e) => onChange({ ...value, statusFilter: e.target.value })}
          style={selectStyle}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      <select
        value={value.platformFilter}
        onChange={(e) => onChange({ ...value, platformFilter: e.target.value })}
        style={selectStyle}
      >
        {PLATFORM_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={value.autoVerdictFilter}
        onChange={(e) => onChange({ ...value, autoVerdictFilter: e.target.value })}
        style={selectStyle}
      >
        {AUTO_VERDICT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>从</span>
        <input
          type="date"
          value={localDateFrom}
          onChange={(e) => handleDateChange('dateFrom', e.target.value)}
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>到</span>
        <input
          type="date"
          value={localDateTo}
          onChange={(e) => handleDateChange('dateTo', e.target.value)}
          style={inputStyle}
        />
      </div>

      {(value.statusFilter || value.platformFilter || value.autoVerdictFilter || value.dateFrom || value.dateTo) && (
        <button
          type="button"
          onClick={() =>
            onChange({ statusFilter: '', platformFilter: '', autoVerdictFilter: '', dateFrom: '', dateTo: '' })
          }
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
