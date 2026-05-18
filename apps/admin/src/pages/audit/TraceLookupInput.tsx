// PRD-11 US-017 · TraceLookupInput — trace_id 反查输入框

import { useState } from 'react';

interface Props {
  onSubmit: (traceId: string) => void;
  loading?: boolean;
}

export function TraceLookupInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length >= 8) onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="输入 trace_id 反查（最少 8 位）"
        style={{
          flex: 1,
          background: 'var(--bg-input, #1a1a1a)',
          border: '1px solid var(--border, #2a2a2a)',
          borderRadius: 4,
          color: 'var(--text-primary, #e0e0e0)',
          fontSize: 13,
          padding: '6px 10px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={loading || value.trim().length < 8}
        style={{
          background: loading ? '#2a2a2a' : 'var(--gold, #d4af37)',
          color: loading ? '#888' : '#000',
          border: 'none',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          padding: '6px 16px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '查询中…' : '查询'}
      </button>
    </form>
  );
}
