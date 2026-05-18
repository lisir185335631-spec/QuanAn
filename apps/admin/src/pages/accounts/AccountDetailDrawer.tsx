// PRD-11 US-011 · AccountDetailDrawer — 右侧抽屉 · 6 tabs
// AC-5: 9步进度图(StepProgressChart) + 进化档案 + 历史时间线 + admin备注 + 异常flag列表
// AC-13: 点账号行→抽屉打开 · 9步进度 + 进化档案 visible

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';
import { StepProgressChart } from './StepProgressChart';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountRow {
  id: number;
  name: string;
  industry: string;
  platform: string;
  stage: string;
  frozenAt: Date | string | null;
  evolutionProfile: { level: string } | null;
}

interface DetailData {
  account: {
    id: number;
    name: string;
    industry: string;
    platform: string;
    stage: string;
    frozenAt: Date | string | null;
    user: { id: number; email: string; name: string | null } | null;
  } | null;
  stepData: Array<{ id: number; stepKey: string; createdAt: Date | string; feedback: string | null }>;
  evolutionProfile: {
    level: string;
    currentDirection: string;
    feedbackCountGood: number;
    feedbackCountBad: number;
    feedbackCountTotal: number;
    satisfactionRate: number | null;
    deepLearningCount: number;
    lastEvolvedAt: Date | string | null;
  } | null;
  insights: Array<{ id: number; triggerType: string; direction: string; createdAt: Date | string }>;
  histories: Array<{ id: number; createdAt: Date | string }>;
  adminNotes: Array<{ id: number; adminId: number; note: string; visibleToOtherAdmin: boolean; createdAt: Date | string }>;
  anomalyFlags: Array<{
    id: number;
    accountId: number;
    anomalyType: string;
    severity: string;
    evidence: Record<string, unknown>;
    detectedAt: Date | string;
    resolvedAt: Date | string | null;
    resolution: string | null;
  }>;
}

interface DrawerProps {
  accountId: number | null;
  account: AccountRow | null;
  role: string | undefined;
  onClose: () => void;
  onForceFreeze: (id: number) => void;
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'basic', label: '基本' },
  { id: 'steps', label: '进度图' },
  { id: 'evolution', label: '进化档案' },
  { id: 'history', label: '历史' },
  { id: 'notes', label: '备注' },
  { id: 'anomaly', label: '异常 flag' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── BasicTab ──────────────────────────────────────────────────────────────────

function BasicTab({ account, detail }: { account: AccountRow; detail: DetailData | null | undefined }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'ID', value: String(account.id) },
    { label: '账号名', value: account.name },
    { label: '行业', value: account.industry },
    { label: '平台', value: account.platform },
    { label: '阶段', value: account.stage },
    { label: '等级', value: account.evolutionProfile?.level ?? '—' },
    { label: '状态', value: account.frozenAt ? `已冻结 (${new Date(String(account.frozenAt)).toLocaleDateString('zh-CN')})` : '正常' },
  ];
  if (detail?.account?.user) {
    rows.push(
      { label: '用户 Email', value: detail.account.user.email },
      { label: '用户 ID', value: String(detail.account.user.id) },
    );
  }
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
          <div style={{ width: 90, flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>{r.label}</div>
          <div style={{ color: 'var(--text)', fontSize: 13, wordBreak: 'break-all' }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── StepsTab ──────────────────────────────────────────────────────────────────

function StepsTab({ detail }: { detail: DetailData | null | undefined }) {
  const stepData = detail?.stepData ?? [];
  const completed = new Set(stepData.map((s) => s.stepKey));
  const completedCount = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => completed.has(`step${n}`)).length;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          9步完成进度 · <span style={{ color: 'var(--gold)' }}>{completedCount} / 9</span> 步已完成
        </div>
        <StepProgressChart stepData={stepData} />
      </div>
      <div style={{ marginTop: 16 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const done = completed.has(`step${n}`);
          return (
            <div
              key={n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: done ? 'var(--accent-purple)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: done ? '#fff' : 'var(--text-dim)',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {n}
              </div>
              <div style={{ flex: 1, fontSize: 12, color: done ? 'var(--text)' : 'var(--text-dim)' }}>
                Step {n}
              </div>
              <div style={{ fontSize: 11, color: done ? 'var(--status-ok)' : 'var(--text-dim)' }}>
                {done ? '✓ 完成' : '未开始'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EvolutionTab ──────────────────────────────────────────────────────────────

function EvolutionTab({ detail }: { detail: DetailData | null | undefined }) {
  const ep = detail?.evolutionProfile;
  const insights = detail?.insights ?? [];

  if (!ep) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>暂无进化档案</div>;
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard label="等级" value={ep.level} />
        <StatCard label="方向" value={ep.currentDirection} />
        <StatCard label="好评数" value={String(ep.feedbackCountGood)} color="var(--status-ok)" />
        <StatCard label="差评数" value={String(ep.feedbackCountBad)} color="var(--status-err)" />
        <StatCard
          label="满意度"
          value={ep.satisfactionRate !== null ? `${(ep.satisfactionRate * 100).toFixed(1)}%` : '—'}
          color="var(--accent-blue)"
        />
        <StatCard label="深度学习次数" value={String(ep.deepLearningCount)} />
      </div>
      {ep.lastEvolvedAt && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          上次进化：{new Date(String(ep.lastEvolvedAt)).toLocaleString('zh-CN')}
        </div>
      )}
      {insights.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            进化洞察 (最新 {insights.length} 条)
          </div>
          {insights.map((ins) => (
            <div
              key={ins.id}
              style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)', flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                  {ins.triggerType} · {ins.direction}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {new Date(String(ins.createdAt)).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 5,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? 'var(--gold)' }}>{value}</div>
    </div>
  );
}

// ── HistoryTab ────────────────────────────────────────────────────────────────

function HistoryTab({ detail }: { detail: DetailData | null | undefined }) {
  const histories = detail?.histories ?? [];
  if (histories.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>暂无历史记录</div>;
  }
  return (
    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
      {histories.map((h, i) => (
        <div
          key={h.id}
          style={{
            display: 'flex',
            gap: 10,
            padding: '8px 0',
            borderBottom: i < histories.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>历史记录 #{h.id}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {new Date(String(h.createdAt)).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── NotesTab ──────────────────────────────────────────────────────────────────

function NotesTab({
  accountId,
  detail,
  role,
  onRefetch,
}: {
  accountId: number;
  detail: DetailData | null | undefined;
  role: string | undefined;
  onRefetch: () => void;
}) {
  const [noteText, setNoteText] = useState('');
  const notes = detail?.adminNotes ?? [];
  const isReadonly = role === 'readonly_admin';

  const addNoteMutation = adminTrpc.ipAccounts.addNote.useMutation({
    onSuccess: () => {
      setNoteText('');
      onRefetch();
    },
    onError: (err) => showToast(`添加备注失败: ${err.message}`, 'err'),
  });

  return (
    <div>
      {!isReadonly && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="添加备注…"
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text)',
              padding: '6px 8px',
              fontSize: 12,
              outline: 'none',
              resize: 'vertical',
              height: 64,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              type="button"
              onClick={() => addNoteMutation.mutate({ accountId, note: noteText })}
              disabled={noteText.trim().length === 0 || addNoteMutation.isPending}
              style={{
                background: noteText.trim() ? 'var(--gold-dim)' : 'var(--bg-hover)',
                border: '1px solid var(--gold)',
                color: noteText.trim() ? 'var(--gold-text)' : 'var(--text-dim)',
                padding: '4px 14px',
                borderRadius: 4,
                cursor: noteText.trim() ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {addNoteMutation.isPending ? '提交中…' : '添加'}
            </button>
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>暂无备注</div>
      ) : (
        notes.map((note, i) => (
          <div
            key={note.id}
            style={{
              padding: '8px 0',
              borderBottom: i < notes.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>{note.note}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Admin #{note.adminId} · {new Date(String(note.createdAt)).toLocaleString('zh-CN')}
              {!note.visibleToOtherAdmin && (
                <span style={{ marginLeft: 6, color: 'var(--text-dim)', border: '1px solid var(--border)', padding: '0 4px', borderRadius: 2 }}>
                  私密
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── AnomalyFlagsTab ────────────────────────────────────────────────────────────

function AnomalyFlagsTab({
  detail,
  role,
  onRefetch,
}: {
  accountId: number;
  detail: DetailData | null | undefined;
  role: string | undefined;
  onRefetch: () => void;
}) {
  const flags = detail?.anomalyFlags ?? [];
  const isReadonly = role === 'readonly_admin';

  const unflagMutation = adminTrpc.ipAccounts.unflag.useMutation({
    onSuccess: () => onRefetch(),
    onError: (err) => showToast(`操作失败: ${err.message}`, 'err'),
  });

  if (flags.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>无未解决异常 flag</div>;
  }

  return (
    <div>
      {flags.map((flag) => {
        const severityColor =
          flag.severity === 'high' ? 'var(--status-err)' : flag.severity === 'medium' ? 'var(--status-warn)' : 'var(--text-muted)';
        return (
          <div
            key={flag.id}
            style={{
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{flag.anomalyType}</span>
              <span
                style={{
                  fontSize: 10,
                  color: severityColor,
                  border: `1px solid ${severityColor}44`,
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {flag.severity}
              </span>
              {flag.resolvedAt && (
                <span style={{ fontSize: 10, color: 'var(--text-dim)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3 }}>
                  已解决
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
              检测于 {new Date(String(flag.detectedAt)).toLocaleString('zh-CN')}
            </div>
            {!flag.resolvedAt && !isReadonly && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => unflagMutation.mutate({ flagId: flag.id, resolution: 'admin_action' })}
                  disabled={unflagMutation.isPending}
                  style={actionBtnStyle('var(--status-ok)')}
                >
                  resolve
                </button>
                <button
                  type="button"
                  onClick={() => unflagMutation.mutate({ flagId: flag.id, resolution: 'false_positive' })}
                  disabled={unflagMutation.isPending}
                  style={actionBtnStyle('var(--text-muted)')}
                >
                  误报
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── AccountDetailDrawer (main) ─────────────────────────────────────────────

export function AccountDetailDrawer({ accountId, account, role, onClose, onForceFreeze }: DrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const isReadonly = role === 'readonly_admin';
  const isOpen = accountId !== null;

  const { data: rawDetail, isLoading, refetch } = adminTrpc.ipAccounts.detail.useQuery(
    { accountId: accountId! },
    { enabled: accountId !== null, staleTime: 30_000 },
  );
  const detail = rawDetail as unknown as DetailData | null | undefined;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'var(--drawer-width)',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {account?.name ?? '账号详情'}
            </div>
            {account && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                {account.industry} · {account.platform} · {account.evolutionProfile?.level ?? '—'}
                {account.frozenAt && (
                  <span style={{ marginLeft: 6, color: 'var(--status-err)' }}>🔒 已冻结</span>
                )}
              </div>
            )}
          </div>
          {!isReadonly && account && !account.frozenAt && (
            <button
              type="button"
              onClick={() => onForceFreeze(account.id)}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444',
                padding: '4px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              强制冻结
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>加载中…</div>
          ) : !account ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>无数据</div>
          ) : (
            <>
              {activeTab === 'basic' && <BasicTab account={account} detail={detail} />}
              {activeTab === 'steps' && <StepsTab detail={detail} />}
              {activeTab === 'evolution' && <EvolutionTab detail={detail} />}
              {activeTab === 'history' && <HistoryTab detail={detail} />}
              {activeTab === 'notes' && (
                <NotesTab
                  accountId={account.id}
                  detail={detail}
                  role={role}
                  onRefetch={() => void refetch()}
                />
              )}
              {activeTab === 'anomaly' && (
                <AnomalyFlagsTab
                  accountId={account.id}
                  detail={detail}
                  role={role}
                  onRefetch={() => void refetch()}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    background: 'none',
    border: `1px solid ${color}44`,
    color,
    padding: '3px 10px',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
  };
}

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
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
