// PRD-13 US-009 · QuotaDetailDrawer
// AC-5: 用户基本信息 + 24h 调用时间线 + active adjustments + 操作面板
// AC-6: adjustmentType select · delta input · reason textarea · dual approval check
// SHIELD: delta > 500 → dual approval · 客户端 + 服务端双校验 (SHIELD anti_pattern)
// SHIELD: whitelist_add 仅 super_admin (AC-6 · backend guardMutation)
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { adminTrpc } from '../../lib/admin-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuotaUserRow {
  id: number;
  userId: number;
  email: string;
  plan: string;
  dailyUsed: number;
  dailyQuota: number;
  usagePct: number;
  isOnWhitelist: boolean;
  whitelistExpiresAt: Date | string | null;
  lastCallAt: Date | string | null;
}

interface Props {
  selected: QuotaUserRow | null;
  role: string | undefined;
  onClose: () => void;
  onAdjusted: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function showToast(msg: string, type: 'ok' | 'warn' | 'err') {
  const el = document.createElement('div');
  const color = type === 'ok' ? '#22c55e' : type === 'warn' ? '#f59e0b' : '#ef4444';
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '9999',
    background: '#111',
    border: `1px solid ${color}`,
    color,
    padding: '10px 18px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  });
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ── AdjustmentForm ────────────────────────────────────────────────────────────

interface FormState {
  adjustmentType: 'increase_daily' | 'increase_monthly' | 'whitelist_add';
  delta: string;
  reason: string;
}

function AdjustmentForm({
  userId,
  role,
  onSuccess,
}: {
  userId: number;
  role: string | undefined;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    adjustmentType: 'increase_daily',
    delta: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const adjustMut = adminTrpc.quota.adjustQuota.useMutation();

  const isSuperAdmin = role === 'super_admin';
  const deltaNum = parseInt(form.delta, 10) || 0;
  // SHIELD: client-side max matches role; server validates independently
  const maxDelta = isSuperAdmin ? 5000 : 500;
  const isDualApproval = deltaNum > 500 || form.adjustmentType === 'whitelist_add';
  const canSubmit =
    form.reason.trim().length >= 10 &&
    deltaNum > 0 &&
    deltaNum <= maxDelta &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await adjustMut.mutateAsync({
        userId,
        adjustmentType: form.adjustmentType,
        delta: deltaNum,
        reason: form.reason.trim(),
      });
      if (result.needsApproval) {
        showToast(`已发起 Approval 申请 #${result.approvalRequestId ?? '?'}`, 'warn');
      } else {
        showToast('已立即生效 24h', 'ok');
      }
      setForm({ adjustmentType: 'increase_daily', delta: '', reason: '' });
      onSuccess();
    } catch {
      showToast('调整失败，请重试', 'err');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        发起配额调整
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          调整类型
        </label>
        <select
          value={form.adjustmentType}
          onChange={(e) => setForm((f) => ({ ...f, adjustmentType: e.target.value as FormState['adjustmentType'] }))}
          style={{
            width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 4, padding: '6px 8px', fontSize: 13,
          }}
        >
          <option value="increase_daily">increase_daily · 临时增加日配额</option>
          <option value="increase_monthly">increase_monthly · 临时增加月配额</option>
          {isSuperAdmin && <option value="whitelist_add">whitelist_add · 加入白名单 24h</option>}
        </select>
      </div>

      {form.adjustmentType !== 'whitelist_add' && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
            delta（最大 {maxDelta}）
          </label>
          <input
            type="number"
            min={1}
            max={maxDelta}
            value={form.delta}
            onChange={(e) => setForm((f) => ({ ...f, delta: e.target.value }))}
            style={{
              width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 4, padding: '6px 8px', fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
          {isDualApproval && deltaNum > 0 && (
            <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 3 }}>
              delta {'>'} 500 → 将发起 dual approval 申请
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          reason（必填 ≥ 10 字）
        </label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          rows={3}
          style={{
            width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', borderRadius: 4, padding: '6px 8px', fontSize: 13,
            resize: 'vertical', boxSizing: 'border-box',
          }}
          placeholder="请填写调整原因（至少 10 个字符）"
        />
        <div style={{ fontSize: 11, color: form.reason.trim().length >= 10 ? '#22c55e' : 'var(--text-muted)', marginTop: 2 }}>
          {form.reason.trim().length} / 10 字符
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!canSubmit}
        style={{
          width: '100%',
          background: canSubmit ? 'var(--gold)' : 'var(--bg-hover)',
          border: 'none',
          color: canSubmit ? '#000' : 'var(--text-muted)',
          borderRadius: 4,
          padding: '8px 0',
          fontSize: 13,
          fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? '提交中…' : isDualApproval ? '提交（需 Dual Approval）' : '提交（立即生效 24h）'}
      </button>
    </div>
  );
}

// ── QuotaDetailDrawer ─────────────────────────────────────────────────────────

export function QuotaDetailDrawer({ selected, role, onClose, onAdjusted }: Props) {
  const { data: hourlyData, isLoading: hourlyLoading } = adminTrpc.quota.getUserHourlyTimeline.useQuery(
    { userId: selected?.userId ?? 0 },
    { enabled: !!selected, staleTime: 30_000 },
  );

  const { data: activeAdj, refetch: refetchActive } = adminTrpc.quota.getActiveAdjustments.useQuery(
    { userId: selected?.userId },
    { enabled: !!selected, staleTime: 30_000 },
  );

  const { data: expiredAdj } = adminTrpc.quota.getExpiredAdjustments.useQuery(
    { userId: selected?.userId },
    { enabled: !!selected, staleTime: 60_000 },
  );

  if (!selected) return null;

  const hourlyChartData =
    hourlyData?.map((h: { hour: number; callCount: number }) => ({
      hour: `${String(h.hour).padStart(2, '0')}:00`,
      calls: h.callCount,
    })) ?? [];

  const activeAdjList = activeAdj ?? [];
  const expiredAdjList = expiredAdj ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 201,
          width: 440, maxWidth: '92vw',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          overflowY: 'auto',
          padding: '20px 20px 32px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>用户配额详情</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* User info */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            用户信息
          </div>
          <StatRow label="Email" value={selected.email} />
          <StatRow label="套餐" value={selected.plan.toUpperCase()} />
          <StatRow label="日配额使用" value={`${selected.dailyUsed} / ${selected.dailyQuota} (${selected.usagePct}%)`} />
          <StatRow label="白名单" value={selected.isOnWhitelist ? `是 · 至 ${fmtDate(selected.whitelistExpiresAt)}` : '否'} />
        </div>

        {/* 24h hourly timeline */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            24h 调用时间线（按小时）
          </div>
          {hourlyLoading ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              加载中…
            </div>
          ) : hourlyChartData.length === 0 ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              24h 内暂无调用
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={hourlyChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', fontSize: 11, borderRadius: 4 }}
                />
                <Line type="monotone" dataKey="calls" stroke="var(--gold)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Active adjustments */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            生效中的调整 ({activeAdjList.length})
          </div>
          {activeAdjList.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>暂无生效中的调整</div>
          ) : (
            activeAdjList.map((adj: { id: number; field: string; delta: number | null; expiresAt: Date | string }) => (
              <div
                key={adj.id}
                style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{adj.field}</span>
                {adj.delta ? ` +${adj.delta}` : ' (whitelist)'}
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                  至 {fmtDate(adj.expiresAt)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Historical (expired) adjustments */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            历史调整记录（已失效，共 {expiredAdjList.length} 条）
          </div>
          {expiredAdjList.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>暂无历史调整记录</div>
          ) : (
            expiredAdjList.map((adj: { id: number; field: string; delta: number | null; expiresAt: Date | string; reason: string }) => (
              <div
                key={adj.id}
                style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ fontWeight: 600 }}>{adj.field}</span>
                {adj.delta ? ` +${adj.delta}` : ' (whitelist)'}
                <span style={{ marginLeft: 8 }}>· 至 {fmtDate(adj.expiresAt)}</span>
                {adj.reason && (
                  <div style={{ fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{adj.reason}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Adjustment form */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
          <AdjustmentForm
            userId={selected.userId}
            role={role}
            onSuccess={() => {
              void refetchActive();
              onAdjusted();
            }}
          />
        </div>
      </div>
    </>
  );
}
