// PRD-12 US-006 · AutoRuleConfigPanel — auto_review_rules 配置面板
// AC-3: ruleType dropdown + ruleKey + ruleValue JSON editor + enabled toggle
// AC-6: ruleValue JSON.parse 前端校验
// Rendered only for super_admin (parent guards with {role === 'super_admin' && ...})

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';

type RuleType = 'banned_word' | 'sampling_rate' | 'industry_quota';

const RULE_TYPE_OPTIONS: { value: RuleType; label: string; hint: string }[] = [
  { value: 'banned_word', label: '违禁词规则', hint: '例：{ "words": ["xxx", "yyy"] }' },
  { value: 'sampling_rate', label: '抽样率规则', hint: '例：{ "rate": 0.1 }' },
  { value: 'industry_quota', label: '行业配额规则', hint: '例：{ "industry": "beauty", "limit": 1000 }' },
];

const fieldStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text)',
  padding: '6px 8px',
  fontSize: 12,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  marginBottom: 4,
  display: 'block',
};

function showToast(msg: string, type: 'ok' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
    background: '#111', border: `1px solid ${color}`, color,
    padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function AutoRuleConfigPanel() {
  const [ruleType, setRuleType] = useState<RuleType>('banned_word');
  const [ruleKey, setRuleKey] = useState('');
  const [ruleValueStr, setRuleValueStr] = useState('{}');
  const [ruleValueErr, setRuleValueErr] = useState('');
  const [enabled, setEnabled] = useState(true);

  const configMut = adminTrpc.reviewTrending.configRules.useMutation({
    onSuccess: (data) => {
      showToast(`规则已保存 · ID #${data.id} · ${data.ruleType}/${data.ruleKey}`, 'ok');
      setRuleKey('');
      setRuleValueStr('{}');
      setRuleValueErr('');
      setEnabled(true);
    },
    onError: (err) => {
      showToast(`保存失败: ${err.message}`, 'err');
    },
  });

  const selectedTypeInfo = RULE_TYPE_OPTIONS.find((o) => o.value === ruleType);

  const handleRuleValueChange = (val: string) => {
    setRuleValueStr(val);
    setRuleValueErr('');
  };

  const handleSubmit = () => {
    if (!ruleKey.trim()) {
      showToast('ruleKey 不能为空', 'err');
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(ruleValueStr) as Record<string, unknown>;
    } catch (e) {
      setRuleValueErr('JSON 格式错: ' + (e as Error).message);
      return;
    }

    configMut.mutate({
      ruleType,
      ruleKey: ruleKey.trim(),
      ruleValue: parsed,
      enabled,
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '20px 24px',
        maxWidth: 560,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--gold)',
          marginBottom: 4,
          letterSpacing: '0.02em',
        }}
      >
        自动审核规则配置
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
        创建或更新 auto_review_rules 规则 · 同 ruleType + ruleKey 自动 upsert
      </div>

      {/* ruleType */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>规则类型 (ruleType)</label>
        <select
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as RuleType)}
          style={{ ...fieldStyle, cursor: 'pointer' }}
        >
          {RULE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({o.value})
            </option>
          ))}
        </select>
      </div>

      {/* ruleKey */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>规则键 (ruleKey)</label>
        <input
          type="text"
          value={ruleKey}
          onChange={(e) => setRuleKey(e.target.value)}
          placeholder="例：global · platform_douyin · industry_beauty"
          style={fieldStyle}
        />
      </div>

      {/* ruleValue JSON editor */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          规则值 (ruleValue) · JSON 格式
          {selectedTypeInfo && (
            <span style={{ color: 'var(--text-dim)', marginLeft: 6, fontStyle: 'italic' }}>
              {selectedTypeInfo.hint}
            </span>
          )}
        </label>
        <textarea
          value={ruleValueStr}
          onChange={(e) => handleRuleValueChange(e.target.value)}
          placeholder="{}"
          spellCheck={false}
          style={{
            ...fieldStyle,
            height: 100,
            resize: 'vertical',
            fontFamily: 'monospace',
            border: ruleValueErr ? '1px solid #ef4444' : '1px solid var(--border)',
          }}
        />
        {ruleValueErr && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{ruleValueErr}</div>
        )}
      </div>

      {/* enabled toggle */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ marginRight: 6, cursor: 'pointer', accentColor: 'var(--gold)' }}
          />
          启用规则 (enabled)
        </label>
        <span style={{ fontSize: 11, color: enabled ? 'var(--status-ok)' : 'var(--text-dim)' }}>
          {enabled ? '✓ 启用' : '○ 禁用'}
        </span>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={configMut.isPending}
        style={{
          background: configMut.isPending ? 'var(--bg-hover)' : 'rgba(200,168,75,0.15)',
          border: '1px solid rgba(200,168,75,0.4)',
          color: configMut.isPending ? 'var(--text-dim)' : 'var(--gold)',
          padding: '7px 20px',
          borderRadius: 4,
          cursor: configMut.isPending ? 'not-allowed' : 'pointer',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {configMut.isPending ? '保存中…' : '保存规则'}
      </button>
    </div>
  );
}
