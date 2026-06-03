// PRD-29.6 US-001 · admin /admin/llm-config · LLM API Key 配置
// super_admin only · 用现有 SystemConfig + _updateSystemConfigInTx · 自动加密
// SHIELD: 不新建 prisma model · 不新建加密逻辑

import { useState } from 'react';

import { adminTrpc } from '../../lib/admin-client';

function maskApiKey(value: unknown): string {
  if (!value || typeof value !== 'string' || value.length === 0) return '';
  if (value.length <= 8) return '***';
  return value.slice(0, 6) + '***' + value.slice(-3);
}

function StatusDot({ set }: { set: boolean }) {
  return (
    <span
      data-testid={set ? 'dot-set' : 'dot-unset'}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: set ? '#22c55e' : '#6b7280',
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);

  function show(msg: string) {
    setToast({ msg, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }

  const node = toast ? (
    <div
      key={toast.key}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: '#22c55e',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {toast.msg}
    </div>
  ) : null;

  return { show, node };
}

type LlmKeyEntry = {
  configKey: 'LLM_ANTHROPIC_API_KEY' | 'LLM_OPENAI_API_KEY';
  label: string;
  placeholder: string;
};

const LLM_KEYS: LlmKeyEntry[] = [
  {
    configKey: 'LLM_ANTHROPIC_API_KEY',
    label: 'Anthropic API Key',
    placeholder: 'sk-ant-...',
  },
  {
    configKey: 'LLM_OPENAI_API_KEY',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
  },
];

export default function LlmConfigPage() {
  const { data: sysConfigs = [], refetch } = adminTrpc.featureFlags.listSystemConfig.useQuery(
    undefined,
    { staleTime: 30_000 },
  );

  const updateMutation = adminTrpc.featureFlags.updateSystemConfig.useMutation({
    onSuccess: () => {
      toast.show('已保存 · 审批已发起');
      void refetch();
    },
  });

  const toast = useToast();

  const [inputs, setInputs] = useState<Record<string, string>>({
    LLM_ANTHROPIC_API_KEY: '',
    LLM_OPENAI_API_KEY: '',
  });

  function getConfigValue(key: string): unknown {
    return sysConfigs.find((c) => c.configKey === key)?.configValue;
  }

  function handleSave(entry: LlmKeyEntry) {
    const value = inputs[entry.configKey] ?? '';
    if (!value.trim()) return;
    updateMutation.mutate({ configKey: entry.configKey, configValue: value.trim() });
    setInputs((prev) => ({ ...prev, [entry.configKey]: '' }));
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, margin: 0 }}>
          🔑 LLM 配置
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
          LLM API Key 管理 · 加密存储 · 双审批
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {LLM_KEYS.map((entry) => {
          const currentValue = getConfigValue(entry.configKey);
          const isSet =
            !!currentValue && typeof currentValue === 'string' && currentValue.length > 0;
          const masked = isSet ? maskApiKey(currentValue) : '';
          const inputValue = inputs[entry.configKey] ?? '';

          return (
            <div
              key={entry.configKey}
              data-testid={`llm-key-card-${entry.configKey}`}
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <StatusDot set={isSet} />
                <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                  {entry.label}
                </span>
                <span
                  data-testid={`status-label-${entry.configKey}`}
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: isSet ? '#22c55e' : 'var(--text-muted)',
                  }}
                >
                  {isSet ? '已设置' : '未设置'}
                </span>
              </div>

              {isSet && (
                <div
                  data-testid={`masked-value-${entry.configKey}`}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 12,
                  }}
                >
                  当前值: {masked}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="password"
                  data-testid={`input-${entry.configKey}`}
                  value={inputValue}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [entry.configKey]: e.target.value }))
                  }
                  placeholder={entry.placeholder}
                  style={{
                    flex: 1,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--text)',
                    padding: '7px 10px',
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  data-testid={`save-btn-${entry.configKey}`}
                  onClick={() => handleSave(entry)}
                  disabled={!inputValue.trim() || updateMutation.isPending}
                  style={{
                    background: inputValue.trim() ? 'var(--gold)' : 'var(--bg-hover)',
                    border: 'none',
                    color: inputValue.trim() ? '#000' : 'var(--text-muted)',
                    padding: '7px 18px',
                    borderRadius: 4,
                    cursor:
                      inputValue.trim() && !updateMutation.isPending ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                    fontWeight: 700,
                    opacity: updateMutation.isPending ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {updateMutation.isPending ? '保存中…' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {updateMutation.isError && (
        <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
          {updateMutation.error?.message ?? '操作失败，请重试'}
        </p>
      )}

      {toast.node}
    </div>
  );
}
