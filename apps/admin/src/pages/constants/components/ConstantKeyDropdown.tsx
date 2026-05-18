// PRD-14 US-009 · ConstantKeyDropdown — constantKey 下拉选择
// AC-11: 按 type 加载选项(case=67 / formula=23 / element=22)
// AC-2: URL state via useSearchParams (SHIELD: not useState)

import { adminTrpc } from '../../../lib/admin-client';

type ConstantType = 'case' | 'formula' | 'element';

interface Props {
  constantType: ConstantType;
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function ConstantKeyDropdown({ constantType, selectedKey, onSelect }: Props) {
  const { data, isLoading } = adminTrpc.constants.listKeys.useQuery(
    { constantType },
    { refetchOnWindowFocus: false },
  );

  const keys = data?.keys ?? [];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>选择常量 Key</span>
      <select
        value={selectedKey}
        onChange={(e) => onSelect(e.target.value)}
        disabled={isLoading || keys.length === 0}
        data-testid="constant-key-select"
        style={{
          background: '#1f2937',
          color: '#e5e7eb',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 12,
          cursor: 'pointer',
          maxWidth: 360,
          flex: 1,
        }}
      >
        {isLoading && <option value="">加载中…</option>}
        {!isLoading && keys.length === 0 && <option value="">暂无选项</option>}
        {keys.map((k) => (
          <option key={k.key} value={k.key}>
            {k.key} — {k.label}
          </option>
        ))}
      </select>
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
        {isLoading ? '…' : `${keys.length} 个`}
      </span>
    </div>
  );
}
