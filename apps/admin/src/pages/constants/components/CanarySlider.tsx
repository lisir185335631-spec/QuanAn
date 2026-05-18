// PRD-14 US-010 · CanarySlider (constants) — 5-step canary pct stepper + status card + rollback
// AC-1: 1:1 fork PRD-13 US-008 · constantType+constantKey replace specialistId+mode
// AC-2: 100% → confirm modal '确认完全发布?(将影响所有用户)' + requestApproval(dual)
// AC-3: 1-50% → direct trpc constant.updateCanary.mutate (no approval)
// AC-4: 0% → client double-confirm
// AC-5: Canary status card with currentVersion + nextVersion + canaryPct
// AC-6: rollback super_admin · reason ≥ 20 chars · dual approval · toast '已发起回滚申请 #X'
// SHIELD: 5-step enum not free input · SHIELD: rollback must walk approval

import { useState } from 'react';

import { adminTrpc } from '../../../lib/admin-client';

// ── Constants ─────────────────────────────────────────────────────────────────

const CANARY_STEPS = [0, 1, 10, 50, 100] as const;
type CanaryStep = (typeof CANARY_STEPS)[number];

const STEP_LABELS: Record<CanaryStep, string> = {
  0: '0%',
  1: '1%',
  10: '10%',
  50: '50%',
  100: '100%',
};

const HASH_TOOLTIP =
  'D-090 哈希分流策略：按用户 user_id × constantType+constantKey 哈希分流，同一用户访问同一常量多次结果一致。';

function scoreColor(score: number): string {
  if (score >= 4.0) return '#22c55e';
  if (score >= 3.5) return '#d4af37';
  return '#ef4444';
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ConstantType = 'case' | 'formula' | 'element';

interface VersionInfo {
  id: number;
  version: number;
  judgeScore: string | null;
  status: string;
}

interface CanarySliderProps {
  constantType: ConstantType;
  constantKey: string;
  currentVersion: VersionInfo | null;
  nextVersion: VersionInfo | null;
  currentCanaryPct: number;
  nextVersionId: number | null;
  isSuperAdmin: boolean;
  onRefetch: () => void;
  onToast: (msg: string) => void;
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
  reasonField,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  danger?: boolean;
  reasonField?: boolean;
}) {
  const [reason, setReason] = useState('');
  const reasonValid = !reasonField || reason.trim().length >= 20;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#0f1117',
          border: `1px solid ${danger ? '#ef4444' : 'var(--border)'}`,
          borderRadius: 8,
          padding: '24px 28px',
          maxWidth: 480,
          width: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: danger ? '#ef4444' : '#e5e7eb', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{body}</div>
        {reasonField && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#e5e7eb', fontSize: 12, marginBottom: 6 }}>回滚原因（至少 20 字）</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                background: '#1f2937',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: '#e5e7eb',
                fontSize: 13,
                padding: '8px 10px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="请说明回滚原因…"
            />
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
              {reason.trim().length} / 20 字
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reasonValid}
            style={{
              background: danger ? '#ef4444' : 'var(--gold)',
              color: danger ? '#fff' : '#0f1117',
              border: 'none',
              borderRadius: 4,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: reasonValid ? 'pointer' : 'default',
              opacity: reasonValid ? 1 : 0.5,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VersionInfoRow ────────────────────────────────────────────────────────────

function VersionInfoRow({
  label,
  vInfo,
  pct,
  badge,
}: {
  label: string;
  vInfo: VersionInfo | null;
  pct: number;
  badge?: string;
}) {
  if (!vInfo) return null;
  const score = vInfo.judgeScore !== null ? parseFloat(vInfo.judgeScore) : null;

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 14px',
      }}
    >
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>v{vInfo.version}</span>
        {score !== null && (
          <span style={{ fontSize: 13, color: scoreColor(score), fontWeight: 600 }}>
            评分 {score.toFixed(1)}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            color: '#60a5fa',
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 3,
            padding: '1px 6px',
          }}
        >
          灰度 {pct}%{pct === 100 ? ' (active)' : ''}
        </span>
        {badge && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              padding: '1px 6px',
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CanarySlider({
  constantType,
  constantKey,
  currentVersion,
  nextVersion,
  currentCanaryPct,
  nextVersionId,
  isSuperAdmin,
  onRefetch,
  onToast,
}: CanarySliderProps) {
  const [confirm, setConfirm] = useState<null | '100pct' | '0pct' | 'rollback'>(null);

  const closestStep = (CANARY_STEPS as unknown as number[]).reduce((prev, cur) =>
    Math.abs(cur - currentCanaryPct) < Math.abs(prev - currentCanaryPct) ? cur : prev,
  ) as CanaryStep;

  const [selectedStep, setSelectedStep] = useState<CanaryStep>(closestStep);

  // AC-3: 1-50% direct update; AC-2: 100% triggers approval internally
  const updateCanaryMut = adminTrpc.constants.updateCanary.useMutation({
    onSuccess: (data) => {
      onToast(`灰度比例已更新为 ${data.canaryPct ?? 0}%`);
      onRefetch();
    },
    onError: (err) => onToast(`更新失败: ${err.message}`),
  });

  // AC-6: rollback must go through dual approval
  const rollbackMut = adminTrpc.constants.rollbackVersion.useMutation({
    onSuccess: (data) => {
      onToast(`已发起回滚申请 #${data.approvalRequestId} · 等待双重审批`);
      onRefetch();
    },
    onError: (err) => onToast(`回滚失败: ${err.message}`),
  });

  const canInteract = isSuperAdmin && nextVersionId !== null;

  function handleStepClick(step: CanaryStep) {
    if (!canInteract) return;
    setSelectedStep(step);

    if (step === 100) {
      // AC-2: 100% requires confirm modal first
      setConfirm('100pct');
    } else if (step === 0) {
      // AC-4: 0% client double-confirm
      setConfirm('0pct');
    } else {
      // AC-3: 1/10/50 → direct update, no approval
      updateCanaryMut.mutate({ constantType, constantKey, nextVersionId: nextVersionId!, canaryPct: step });
    }
  }

  function handleConfirm100() {
    setConfirm(null);
    if (nextVersionId === null) return;
    updateCanaryMut.mutate({ constantType, constantKey, nextVersionId, canaryPct: 100 });
  }

  function handleConfirm0() {
    setConfirm(null);
    if (nextVersionId === null) return;
    updateCanaryMut.mutate({ constantType, constantKey, nextVersionId, canaryPct: 0 });
  }

  function handleRollback(reason?: string) {
    setConfirm(null);
    if (!reason || reason.trim().length < 20) return;
    rollbackMut.mutate({ constantType, constantKey });
  }

  const isPending = updateCanaryMut.isPending || rollbackMut.isPending;

  return (
    <div>
      {/* Canary Status Card (AC-5) */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          灰度状态
        </div>
        {nextVersion ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <VersionInfoRow
              label="当前版本 (active)"
              vInfo={currentVersion}
              pct={100 - currentCanaryPct}
              badge="current"
            />
            <VersionInfoRow
              label="灰度版本 (canary)"
              vInfo={nextVersion}
              pct={currentCanaryPct}
              badge="canary"
            />
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            暂无灰度配置 · 请先提交新版本审核，审批通过后可配置灰度
          </div>
        )}
      </div>

      {/* 5-step Stepper (AC-1/3) */}
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            调整灰度比例
          </span>
          <span
            title={HASH_TOOLTIP}
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              fontSize: 11,
              textAlign: 'center',
              lineHeight: '16px',
              cursor: 'help',
              userSelect: 'none',
            }}
          >
            ?
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {CANARY_STEPS.map((step) => {
            const isActive = step === selectedStep;
            const isCurrent = step === currentCanaryPct;
            return (
              <button
                key={step}
                onClick={() => handleStepClick(step)}
                disabled={isPending || !canInteract}
                title={isCurrent ? '当前值' : ''}
                style={{
                  background: isActive ? 'var(--gold)' : isCurrent ? 'rgba(212,175,55,0.2)' : '#1f2937',
                  color: isActive ? '#0f1117' : '#e5e7eb',
                  border: isCurrent ? '1px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '5px 14px',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                  cursor: isPending || !canInteract ? 'default' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                  transition: 'background 0.15s, color 0.15s',
                  minWidth: 48,
                }}
              >
                {STEP_LABELS[step]}
              </button>
            );
          })}
        </div>
        {!isSuperAdmin && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            仅 super_admin 可调整灰度比例
          </div>
        )}
        {isSuperAdmin && nextVersionId === null && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            无灰度版本 · 需要先提交待审核版本
          </div>
        )}
      </div>

      {/* Rollback button (AC-6) */}
      {isSuperAdmin && (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>一键回滚</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              超级危险 · 将切换至上一版本 active · 全量影响所有用户 · 走双重审批
            </div>
          </div>
          <button
            onClick={() => setConfirm('rollback')}
            disabled={isPending}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: isPending ? 'default' : 'pointer',
              flexShrink: 0,
              opacity: isPending ? 0.6 : 1,
            }}
          >
            一键回滚
          </button>
        </div>
      )}

      {/* Confirm modals */}
      {confirm === '100pct' && (
        <ConfirmModal
          title="确认完全发布?"
          body="将影响所有用户 · 灰度比例升至 100% · 需双重审批"
          confirmLabel="申请完全发布"
          onConfirm={handleConfirm100}
          onCancel={() => {
            setConfirm(null);
            setSelectedStep(closestStep);
          }}
        />
      )}
      {confirm === '0pct' && (
        <ConfirmModal
          title="确认暂停灰度?"
          body="将停止向新用户推送灰度版本 · 灰度比例降至 0%"
          confirmLabel="确认暂停"
          onConfirm={handleConfirm0}
          onCancel={() => {
            setConfirm(null);
            setSelectedStep(closestStep);
          }}
        />
      )}
      {confirm === 'rollback' && (
        <ConfirmModal
          title="一键回滚 — 超级危险操作"
          body="将发起申请切换至上一个 active 版本 · 影响所有用户 · 需双重审批通过后生效。"
          confirmLabel="提交回滚申请"
          onConfirm={handleRollback}
          onCancel={() => setConfirm(null)}
          danger
          reasonField
        />
      )}
    </div>
  );
}
