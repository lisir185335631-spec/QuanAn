// PRD-12 US-010 · ReviewDeepLearnFilters
// userIdFilter / statusFilter / autoVerdictFilter / fileMimeFilter / dateRange · debounce 300ms

import { useCallback, useEffect, useRef, useState } from 'react';

export interface DeepLearnFilterState {
  statusFilter: string;
  userIdFilter: string;
  autoVerdictFilter: string;
  fileMimeFilter: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  value: DeepLearnFilterState;
  onChange: (f: DeepLearnFilterState) => void;
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
  width: 80,
};

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已驳回' },
  { value: 'auto_approved', label: '自动批准' },
  { value: 'auto_rejected', label: '自动驳回' },
];

const AUTO_VERDICT_OPTIONS = [
  { value: '', label: '全部判定' },
  { value: 'auto_approved', label: '自动批准' },
  { value: 'auto_rejected', label: '自动驳回' },
  { value: 'needs_review', label: '需人工审核' },
];

const MIME_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'text/plain', label: '文本' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
  { value: 'text/markdown', label: 'Markdown' },
];

export function ReviewDeepLearnFilters({ value, onChange }: Props) {
  const [localUserId, setLocalUserId] = useState(value.userIdFilter);
  const [localDateFrom, setLocalDateFrom] = useState(value.dateFrom);
  const [localDateTo, setLocalDateTo] = useState(value.dateTo);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalUserId(value.userIdFilter);
    setLocalDateFrom(value.dateFrom);
    setLocalDateTo(value.dateTo);
  }, [value.userIdFilter, value.dateFrom, value.dateTo]);

  const debounce = useCallback(
    (key: keyof DeepLearnFilterState, val: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange({ ...value, [key]: val });
      }, 300);
    },
    [value, onChange],
  );

  const hasFilters =
    value.statusFilter ||
    value.userIdFilter ||
    value.autoVerdictFilter ||
    value.fileMimeFilter ||
    value.dateFrom ||
    value.dateTo;

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

      <input
        type="text"
        value={localUserId}
        onChange={(e) => {
          setLocalUserId(e.target.value);
          debounce('userIdFilter', e.target.value);
        }}
        placeholder="用户 ID"
        style={inputStyle}
      />

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

      <select
        value={value.fileMimeFilter}
        onChange={(e) => onChange({ ...value, fileMimeFilter: e.target.value })}
        style={selectStyle}
      >
        {MIME_OPTIONS.map((o) => (
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
          onChange={(e) => {
            setLocalDateFrom(e.target.value);
            debounce('dateFrom', e.target.value);
          }}
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>到</span>
        <input
          type="date"
          value={localDateTo}
          onChange={(e) => {
            setLocalDateTo(e.target.value);
            debounce('dateTo', e.target.value);
          }}
          style={inputStyle}
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({
              statusFilter: '',
              userIdFilter: '',
              autoVerdictFilter: '',
              fileMimeFilter: '',
              dateFrom: '',
              dateTo: '',
            })
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
