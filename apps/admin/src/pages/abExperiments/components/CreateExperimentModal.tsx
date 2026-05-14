// PRD-14 US-004 · CreateExperimentModal
// AC-6: 6 字段(experimentKey/name/description/variantConfig JSON editor/trafficAllocation 滑块 sum=100/提交)
// AC-7: 提交走 trpc abExperiment.create.mutate · toast '已发起启动申请 #X · 等待 dual approval'
// SHIELD: trafficAllocation sum=100 客户端校验 + 服务端双校验

import { useState } from 'react';

import { adminTrpc } from '../../../lib/admin-client';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface TrafficAlloc {
  control: number;
  variant_a: number;
  variant_b: number;
}

export function CreateExperimentModal({ onClose, onCreated }: Props) {
  const [experimentKey, setExperimentKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variantConfigRaw, setVariantConfigRaw] = useState('{\n  "control": {},\n  "variant_a": {},\n  "variant_b": {}\n}');
  const [trafficAlloc, setTrafficAlloc] = useState<TrafficAlloc>({
    control: 50,
    variant_a: 30,
    variant_b: 20,
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [allocError, setAllocError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const createMutation = adminTrpc.abExperiments.create.useMutation();
  const startMutation = adminTrpc.abExperiments.start.useMutation();

  const allocSum = trafficAlloc.control + trafficAlloc.variant_a + trafficAlloc.variant_b;

  function handleAllocChange(key: keyof TrafficAlloc, val: number) {
    const next = { ...trafficAlloc, [key]: val };
    const sum = next.control + next.variant_a + next.variant_b;
    // SHIELD: client-side sum=100 check
    setAllocError(sum !== 100 ? `流量分配总和必须为 100，当前为 ${sum}` : null);
    setTrafficAlloc(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate JSON
    let variantConfig: Record<string, unknown>;
    try {
      variantConfig = JSON.parse(variantConfigRaw) as Record<string, unknown>;
      setJsonError(null);
    } catch {
      setJsonError('variantConfig 不是合法 JSON');
      return;
    }

    // Validate alloc sum
    if (allocSum !== 100) {
      setAllocError(`流量分配总和必须为 100，当前为 ${allocSum}`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createMutation.mutateAsync({
        experimentKey: experimentKey.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        variantConfig,
        trafficAllocation: trafficAlloc,
      });

      // Start → dual approval
      const started = await startMutation.mutateAsync({
        experimentId: created.id,
        reason: `新建实验 ${created.experimentKey}`,
      });

      setToast(`已发起启动申请 #${started.approvalRequestId} · 等待 dual approval`);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交失败';
      setAllocError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '24px 28px',
          width: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700 }}>新建 A/B 实验</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>
            ×
          </button>
        </div>

        {toast && (
          <div style={{ background: '#16a34a22', border: '1px solid #22c55e', borderRadius: 6, padding: '8px 12px', marginBottom: 16, color: '#22c55e', fontSize: 13 }}>
            {toast}
          </div>
        )}

        <form onSubmit={(e) => { void handleSubmit(e); }}>
          {/* experimentKey */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Experiment Key</label>
            <input
              value={experimentKey}
              onChange={(e) => setExperimentKey(e.target.value)}
              placeholder="e.g. specialist-v2-test"
              required
              style={inputStyle}
            />
          </div>

          {/* name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>实验名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="简短描述性名称"
              required
              style={inputStyle}
            />
          </div>

          {/* description */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>描述（选填）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="实验目的、假设等"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* variantConfig JSON */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Variant Config (JSON)</label>
            <textarea
              value={variantConfigRaw}
              onChange={(e) => {
                setVariantConfigRaw(e.target.value);
                setJsonError(null);
              }}
              rows={6}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            />
            {jsonError && (
              <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{jsonError}</div>
            )}
          </div>

          {/* trafficAllocation sliders */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              流量分配{' '}
              <span style={{ color: allocSum === 100 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                (合计 {allocSum}/100)
              </span>
            </label>
            {(['control', 'variant_a', 'variant_b'] as const).map((key) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 80 }}>{key}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={trafficAlloc[key]}
                  onChange={(e) => handleAllocChange(key, Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--text-primary)', fontSize: 13, minWidth: 30, textAlign: 'right' }}>
                  {trafficAlloc[key]}%
                </span>
              </div>
            ))}
            {allocError && (
              <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{allocError}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || allocSum !== 100}
              style={{
                ...primaryBtnStyle,
                opacity: submitting || allocSum !== 100 ? 0.5 : 1,
                cursor: submitting || allocSum !== 100 ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '提交中…' : '创建并发起审批'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-muted)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 5,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '7px 10px',
  color: 'var(--text-primary)',
  fontSize: 13,
  boxSizing: 'border-box',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--gold)',
  color: '#000',
  border: 'none',
  borderRadius: 5,
  padding: '8px 18px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
};
