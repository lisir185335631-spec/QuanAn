// PRD-11 US-007 · UserDetailDrawer — right-side drawer + 5 Tab sub-components
// All 5 tabs are inline sub-components in this file (AC-4 · avoid 13-file split)

import { useState } from 'react';
import { adminTrpc } from '../../lib/admin-client';
import { PlanBadge } from './PlanBadge';

// ── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  industry: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  isBanned: boolean;
}

// Explicit detail data shape to avoid tRPC ReturnType inference complexity
interface DetailData {
  user: {
    id: number;
    email: string;
    name: string | null;
    ipAccounts: Array<{
      id: number;
      platformType: string;
      platformUsername: string | null;
      isActive: boolean;
      createdAt: string;
      evolutionProfile: { currentStep: number; feedbackScore: number | null } | null;
    }>;
  } | null;
  ipAccounts: Array<{
    id: number;
    platformType: string;
    platformUsername: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
  costAggregate: {
    _sum: { totalTokens: number | null };
    _count: { id: number };
  };
  auditLogs: Array<{
    id: number;
    eventType: string;
    eventCategory: string;
    createdAt: string;
    payload: Record<string, unknown> | null;
  }>;
  stepData: Array<{
    id: number;
    stepKey: string;
    createdAt: string;
    feedback: string | null;
  }>;
}

interface DrawerProps {
  userId: number | null;
  user: UserRow | null;
  role: string | undefined;
  onClose: () => void;
  onChangePlan: (userId: number) => void;
  onBanUser: (userId: number) => void;
  onResetPassword: (userId: number) => void;
}

// ── Tab Definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'basic', label: '基本' },
  { id: 'activity', label: '活跃度' },
  { id: 'cost', label: '成本' },
  { id: 'audit', label: '审计' },
  { id: 'accounts', label: '关联账号' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── BasicTab ─────────────────────────────────────────────────────────────────

function BasicTab({ user, detail }: { user: UserRow; detail: DetailData | null | undefined }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'ID', value: String(user.id) },
    { label: 'Email', value: user.email },
    { label: '昵称', value: user.name ?? '—' },
    { label: '角色', value: user.role },
    { label: '套餐', value: user.plan },
    { label: '行业', value: user.industry ?? '—' },
    { label: '最近登录', value: user.lastLoginAt ? new Date(String(user.lastLoginAt)).toLocaleString('zh-CN') : '—' },
    { label: 'IP', value: user.lastLoginIp ?? '—' },
    { label: '注册时间', value: new Date(String(user.createdAt)).toLocaleString('zh-CN') },
    { label: '状态', value: user.isBanned ? '已封禁' : '正常' },
  ];
  if (detail?.user?.ipAccounts) {
    rows.push({ label: 'IP账号数', value: String(detail.user.ipAccounts.length) });
  }
  return (
    <div>
      {rows.map((r) => (
        <div
          key={r.label}
          style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border)', gap: 12 }}
        >
          <div style={{ width: 90, flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>{r.label}</div>
          <div style={{ color: 'var(--text)', fontSize: 13, wordBreak: 'break-all' }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── ActivityTab ──────────────────────────────────────────────────────────────

function FeedbackPie({ yes, no }: { yes: number; no: number }) {
  const total = yes + no;
  if (total === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无反馈数据</div>;
  // r=15.9155 → circumference ≈ 100, dasharray values are percentages directly
  const yesPct = (yes / total) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={52} height={52} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
        {/* negative background ring */}
        <circle cx={20} cy={20} r={15.9155} fill="none" stroke="rgba(239,68,68,0.35)" strokeWidth={5} />
        {/* positive arc overlay */}
        <circle
          cx={20} cy={20} r={15.9155} fill="none"
          stroke="#22c55e"
          strokeWidth={5}
          strokeDasharray={`${yesPct} ${100 - yesPct}`}
          strokeDashoffset={25}
          transform="rotate(-90 20 20)"
          strokeLinecap="butt"
        />
        <text x={20} y={20} textAnchor="middle" dominantBaseline="central" fontSize={8} fill="var(--text)" fontWeight={700}>
          {Math.round(yesPct)}%
        </text>
      </svg>
      <div style={{ fontSize: 12 }}>
        <div style={{ color: '#22c55e', marginBottom: 3 }}>● {yes} 好评</div>
        <div style={{ color: '#ef4444', marginBottom: 3 }}>● {no} 差评</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>共 {total} 条</div>
      </div>
    </div>
  );
}

function ActivityCalendar({ stepData }: { stepData: Array<{ createdAt: string }> }) {
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const byDay: Record<string, number> = {};
  for (const s of stepData) {
    const day = new Date(s.createdAt).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const maxDay = Math.max(1, ...last30.map((d) => byDay[d] ?? 0));
  return (
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>近 30 天活跃日历</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {last30.map((day) => {
          const count = byDay[day] ?? 0;
          const intensity = count / maxDay;
          return (
            <div
              key={day}
              title={`${day}: ${count} 步`}
              style={{
                height: 13,
                borderRadius: 2,
                background: count === 0
                  ? 'var(--border)'
                  : `rgba(212,175,55,${0.2 + intensity * 0.8})`,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--text-dim)', fontSize: 10 }}>
        <span>30天前</span>
        <span>今天</span>
      </div>
    </div>
  );
}

function ActivityTab({ detail }: { detail: DetailData | null | undefined }) {
  const stepData = detail?.stepData ?? [];

  const stepCounts: Record<string, number> = {};
  let feedbackYes = 0, feedbackNo = 0;
  for (const s of stepData) {
    stepCounts[s.stepKey] = (stepCounts[s.stepKey] ?? 0) + 1;
    if (s.feedback === 'positive') feedbackYes++;
    else if (s.feedback === 'negative') feedbackNo++;
  }

  const STEPS = ['step1','step2','step3','step4','step5','step6','step7','step8','step9'];
  const maxCount = Math.max(1, ...STEPS.map((k) => stepCounts[k] ?? 0));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>9步完成进度</div>
        {STEPS.map((step, i) => {
          const count = stepCounts[step] ?? 0;
          const pct = (count / maxCount) * 100;
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 40, flexShrink: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                Step {i + 1}
              </div>
              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'var(--gold)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ width: 30, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{count}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>反馈饼图</div>
        <FeedbackPie yes={feedbackYes} no={feedbackNo} />
      </div>

      <ActivityCalendar stepData={stepData} />
    </div>
  );
}

// ── CostTab ───────────────────────────────────────────────────────────────────

function monthlyActivity(stepData: Array<{ createdAt: string }>): Array<{ label: string; count: number }> {
  const buckets: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = 0;
  }
  for (const s of stepData) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in buckets) buckets[key] = (buckets[key] ?? 0) + 1;
  }
  return Object.entries(buckets).map(([k, v]) => ({ label: k.slice(5), count: v }));
}

function MonthlyTrendLine({ stepData }: { stepData: Array<{ createdAt: string }> }) {
  const data = monthlyActivity(stepData);
  const maxVal = Math.max(1, ...data.map((d) => d.count));
  const W = 220, H = 64, PX = 10, PY = 8;

  const pts = data.map((d, i) => {
    const x = PX + (i / (data.length - 1)) * (W - PX * 2);
    const y = PY + (1 - d.count / maxVal) * (H - PY * 2);
    return { x, y, ...d };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>月度使用趋势（近6月步骤量）</div>
      <svg width={W} height={H} style={{ overflow: 'visible', display: 'block' }}>
        <polyline points={polyline} fill="none" stroke="var(--gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={3} fill="var(--gold)" />
        ))}
        {pts.map((p) => (
          <text key={`l-${p.label}`} x={p.x} y={H} textAnchor="middle" fontSize={9} fill="var(--text-dim)">{p.label}</text>
        ))}
      </svg>
    </div>
  );
}

function CostTab({ detail }: { detail: DetailData | null | undefined }) {
  const agg = detail?.costAggregate;
  const totalTokens = agg?._sum?.totalTokens ?? 0;
  const totalCalls = agg?._count?.id ?? 0;
  const stepData = detail?.stepData ?? [];

  // Top-5 steps by frequency as proxy for specialist cost breakdown
  const stepGroups: Record<string, number> = {};
  for (const s of stepData) {
    stepGroups[s.stepKey] = (stepGroups[s.stepKey] ?? 0) + 1;
  }
  const top5 = Object.entries(stepGroups).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxTop = Math.max(1, ...top5.map(([, v]) => v));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>总 Tokens</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{totalTokens.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>调用次数</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)' }}>{totalCalls.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <MonthlyTrendLine stepData={stepData} />
      </div>

      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>Top 5 步骤使用量</div>
        {top5.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>暂无步骤数据</div>
        ) : top5.map(([stepKey, count]) => (
          <div key={stepKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 48, flexShrink: 0, fontSize: 11, color: 'var(--text-muted)' }}>{stepKey}</div>
            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
              <div style={{ width: `${(count / maxTop) * 100}%`, height: '100%', background: 'var(--gold)', borderRadius: 3 }} />
            </div>
            <div style={{ width: 30, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AuditTab ───────────────────────────────────────────────────────────────────

function AuditTab({ detail }: { detail: DetailData | null | undefined }) {
  const logs = detail?.auditLogs ?? [];
  if (logs.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>暂无审计记录</div>;
  }
  return (
    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
      {logs.map((log, i) => (
        <div
          key={log.id}
          style={{
            display: 'flex',
            gap: 10,
            padding: '8px 0',
            borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--gold)',
              flexShrink: 0,
              marginTop: 4,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{log.eventType}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.eventCategory}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              {new Date(log.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AccountsTab ───────────────────────────────────────────────────────────────

function AccountsTab({ detail }: { detail: DetailData | null | undefined }) {
  const accounts = detail?.ipAccounts ?? [];
  if (accounts.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>暂无 IP 账号</div>;
  }
  return (
    <div>
      {accounts.map((acc) => (
        <div
          key={acc.id}
          style={{
            display: 'flex',
            gap: 10,
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            📱
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
              {acc.platformType}
              {acc.platformUsername && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>@{acc.platformUsername}</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              注册 {new Date(acc.createdAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              color: acc.isActive ? 'var(--status-ok)' : 'var(--text-dim)',
              padding: '1px 6px',
              border: `1px solid ${acc.isActive ? 'var(--status-ok)' : 'var(--border)'}33`,
              borderRadius: 3,
            }}
          >
            {acc.isActive ? '活跃' : '停用'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── UserDetailDrawer (main) ────────────────────────────────────────────────

export function UserDetailDrawer({
  userId,
  user,
  role,
  onClose,
  onChangePlan,
  onBanUser,
  onResetPassword,
}: DrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');

  const { data: rawDetail, isLoading } = adminTrpc.users.detail.useQuery(
    { userId: userId! },
    { enabled: userId !== null, staleTime: 30_000 },
  );
  const detail = rawDetail as unknown as DetailData | null | undefined;

  const isReadonly = role === 'readonly_admin';
  const isOpen = userId !== null;

  return (
    <>
      {/* backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
          }}
        />
      )}

      {/* drawer panel */}
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
        {/* header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {user?.name ?? user?.email ?? '用户详情'}
            </div>
            {user && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <PlanBadge plan={user.plan} isBanned={user.isBanned} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</span>
              </div>
            )}
          </div>
          {!isReadonly && user && (
            <div style={{ display: 'flex', gap: 6 }}>
              <ActionButton label="改套餐" onClick={() => onChangePlan(user.id)} color="var(--accent-blue)" />
              <ActionButton label="封禁" onClick={() => onBanUser(user.id)} color="var(--status-err)" disabled={user.isBanned} />
              <ActionButton label="重置密码" onClick={() => onResetPassword(user.id)} color="var(--text-muted)" />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, paddingTop: 8 }}>加载中…</div>
          ) : !user ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>无数据</div>
          ) : (
            <>
              {activeTab === 'basic' && <BasicTab user={user} detail={detail} />}
              {activeTab === 'activity' && <ActivityTab detail={detail} />}
              {activeTab === 'cost' && <CostTab detail={detail} />}
              {activeTab === 'audit' && <AuditTab detail={detail} />}
              {activeTab === 'accounts' && <AccountsTab detail={detail} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ActionButton({
  label,
  onClick,
  color,
  disabled,
}: {
  label: string;
  onClick: () => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none',
        border: `1px solid ${color}55`,
        color: disabled ? 'var(--text-dim)' : color,
        padding: '4px 10px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
