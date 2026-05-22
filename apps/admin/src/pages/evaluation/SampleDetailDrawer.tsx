// PRD-28 US-006 AC-2 · SampleDetailDrawer · 单样本详情抽屉

interface Sample {
  id: number;
  goldenId: string;
  specialistId: string;
  mode: string | null;
  structurePass: boolean;
  judgeScore: number;
  judgePass: boolean;
  judgeReason: string;
  costUsd: string | number;
  durationMs: number;
}

interface Props {
  sample: Sample | null;
  onClose: () => void;
}

export function SampleDetailDrawer({ sample, onClose }: Props) {
  if (!sample) return null;

  return (
    <>
      {/* Overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="关闭抽屉"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onClose(); }}
      />
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 480,
          height: '100vh',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          zIndex: 101,
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>
            样本详情
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['Golden ID', sample.goldenId],
              ['Specialist', sample.specialistId],
              ['Mode', sample.mode ?? 'default'],
              ['Structure Pass', sample.structurePass ? '✅ 是' : '❌ 否'],
              ['Judge Score', String(sample.judgeScore)],
              ['Judge Pass', sample.judgePass ? '✅ 是' : '❌ 否'],
              ['Cost USD', `$${Number(sample.costUsd).toFixed(4)}`],
              ['Duration', `${sample.durationMs}ms`],
            ].map(([label, value]) => (
              <tr key={label}>
                <td
                  style={{
                    padding: '8px 0',
                    color: 'var(--text-dim)',
                    width: 130,
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: '8px 0',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Judge 原因</div>
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: 12,
              fontSize: 12,
              color: 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {sample.judgeReason || '（无）'}
          </div>
        </div>
      </div>
    </>
  );
}
