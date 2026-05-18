// PRD-11 US-021 · InviteDetailDrawer · 点邀请码 → 抽屉 · 激活历史 + 9步进度

import { adminTrpc } from '../../lib/admin-client';

interface Props {
  code: string | null;
  onClose: () => void;
}

const STEP_LABELS: Record<string, string> = {
  step1: '第1步·平台连接',
  step2: '第2步·内容分析',
  step3: '第3步·方向确认',
  step3b: '第3b步·深度调研',
  step4: '第4步·账号规划',
  step5: '第5步·内容制作',
  step6: '第6步·发布测试',
  step7: '第7步·数据复盘',
  step8: '第8步·优化迭代',
  step9: '第9步·完成提交',
};

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--status-ok, #4caf50)',
  in_progress: 'var(--gold, #d4af37)',
  pending: 'var(--text-muted, #888)',
  skipped: 'var(--status-warn, #ff9800)',
};

export function InviteDetailDrawer({ code, onClose }: Props) {
  const { data, isLoading, isError } = adminTrpc.inviteCodes.detail.useQuery(
    { code: code ?? '' },
    { enabled: !!code, staleTime: 30_000 },
  );

  if (!code) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 480,
          height: '100%',
          background: 'var(--bg-panel, #111)',
          borderLeft: '1px solid var(--border, #2a2a2a)',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #888)', marginBottom: 2 }}>邀请码详情</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold, #d4af37)', fontFamily: 'monospace' }}>
              {code}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted, #888)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {isLoading && (
          <div style={{ color: 'var(--text-muted, #888)', fontSize: 13 }}>加载中…</div>
        )}

        {isError && (
          <div style={{ color: 'var(--status-err, #ef4444)', fontSize: 13 }}>加载失败</div>
        )}

        {data && (
          <>
            {/* Invite metadata */}
            <Section title="基本信息">
              <InfoRow label="状态" value={data.invite.isActive ? '有效' : '已失效'} valueColor={data.invite.isActive ? 'var(--status-ok, #4caf50)' : 'var(--status-err, #ef4444)'} />
              <InfoRow label="Campaign" value={data.invite.campaign ?? '—'} />
              <InfoRow label="配额" value={`${data.invite.usedCount} / ${data.invite.maxUses}`} />
              <InfoRow label="创建时间" value={fmtDate(data.invite.createdAt)} />
              <InfoRow label="过期时间" value={data.invite.expiresAt ? fmtDate(data.invite.expiresAt) : '永不过期'} />
              <InfoRow label="创建者" value={data.invite.createdBy?.email ?? '—'} />
              {data.invite.usedBy && (
                <InfoRow label="使用者" value={data.invite.usedBy.email} />
              )}
              {data.invite.notes && (
                <InfoRow label="备注" value={data.invite.notes} />
              )}
            </Section>

            {/* Activation history */}
            <Section title={`激活历史 (${data.activationHistory.length})`}>
              {data.activationHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted, #888)', fontSize: 12 }}>暂无激活记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.activationHistory.map((entry) => (
                    <div
                      key={String(entry.id)}
                      style={{
                        background: 'var(--bg, #0a0a0a)',
                        border: '1px solid var(--border, #2a2a2a)',
                        borderRadius: 4,
                        padding: '8px 10px',
                        fontSize: 11,
                      }}
                    >
                      <div style={{ color: 'var(--text, #e0e0e0)', marginBottom: 3 }}>
                        {entry.eventType}
                      </div>
                      <div style={{ color: 'var(--text-muted, #888)', display: 'flex', gap: 12 }}>
                        <span>{fmtDate(entry.createdAt)}</span>
                        {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Step 9 progress */}
            <Section title="9步进度">
              {data.step9Progress.length === 0 ? (
                <div style={{ color: 'var(--text-muted, #888)', fontSize: 12 }}>暂无进度记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.step9Progress.map((step) => (
                    <div
                      key={step.stepKey}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: STATUS_COLOR[step.status] ?? 'var(--text-muted, #888)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ color: 'var(--text, #e0e0e0)', flex: 1 }}>
                        {STEP_LABELS[step.stepKey] ?? step.stepKey}
                      </div>
                      <div style={{ color: 'var(--text-muted, #888)', fontSize: 11 }}>
                        {step.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted, #888)' }}>{label}</span>
      <span style={{ color: valueColor ?? 'var(--text, #e0e0e0)' }}>{value}</span>
    </div>
  );
}

function fmtDate(d: Date | string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return String(d);
  }
}
