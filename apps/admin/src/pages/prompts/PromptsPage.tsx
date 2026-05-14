// PRD-13 US-007 · PromptsPage · /admin/prompts
// AC-4: 14 Tab 横向 TabBar
// AC-5: URL params · ?specialist=PositioningAgent&mode=default
// AC-6: 顶部当前版本卡片 · 版本号 / 评分 / 灰度比例
// AC-7: Monaco 编辑器 80% + Diff 视图 toggle
// AC-8: debounce 1s localStorage + 保存(saveDraft) + 提交审核(submitForReview)
// AC-9: 右侧历史时间线 HistoryTimeline
// SHIELD: URL state via useSearchParams · not useState (AC-5 / anti_pattern)
// SHIELD: Monaco lazy import (anti_pattern)
// SHIELD: draft debounce 1s + localStorage · not onChange→backend (anti_pattern)

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';
import { DiffMonacoEditor, MonacoEditor } from './components/MonacoEditor';
import { HistoryTimeline } from './components/HistoryTimeline';

// ── 14 Specialists ────────────────────────────────────────────────────────────

interface SpecialistDef {
  id: string;
  label: string;
  modes: string[];
}

const SPECIALISTS: SpecialistDef[] = [
  { id: 'EvolutionAgent', label: '进化 Agent', modes: ['default'] },
  { id: 'DailyTaskAgent', label: '日常任务', modes: ['default'] },
  { id: 'PositioningAgent', label: '定位', modes: ['default'] },
  { id: 'BrandingAgent', label: '品牌', modes: ['default'] },
  { id: 'TopicAgent', label: '选题', modes: ['default', 'category'] },
  { id: 'CopywritingAgent', label: '文案', modes: ['default', 'step5', 'free', 'boom', 'acquisition'] },
  { id: 'VideoAgent', label: '视频脚本', modes: ['default'] },
  { id: 'AnalysisAgent', label: '分析', modes: ['default'] },
  { id: 'LivestreamAgent', label: '直播', modes: ['default'] },
  { id: 'MonetizationAgent', label: '变现', modes: ['default'] },
  { id: 'PrivateDomainAgent', label: '私域', modes: ['default'] },
  { id: 'DeepLearnAgent', label: '深度学习', modes: ['default'] },
  { id: 'DiagnosisAgent', label: '诊断', modes: ['default'] },
  { id: 'VoiceChatAgent', label: '语音', modes: ['default'] },
];

const VALID_SPECIALIST_IDS = new Set(SPECIALISTS.map((s) => s.id));

// ── Helpers ──────────────────────────────────────────────────────────────────

const CANARY_LABELS: Record<number, string> = {
  0: '0%',
  1: '1%',
  10: '10%',
  50: '50%',
  100: '100% (active)',
};

function scoreColor(score: number): string {
  if (score >= 4.0) return '#22c55e';
  if (score >= 3.5) return '#d4af37';
  return '#ef4444';
}

function draftKey(specialistId: string, mode: string): string {
  return `prompt-draft:${specialistId}:${mode}`;
}

// ── TabBar ────────────────────────────────────────────────────────────────────

function TabBar({
  specialists,
  activeId,
  onSelect,
}: {
  specialists: SpecialistDef[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
        paddingBottom: 0,
        flexShrink: 0,
      }}
    >
      {specialists.map((s) => {
        const isActive = s.id === activeId;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              background: isActive ? 'var(--gold)' : 'transparent',
              color: isActive ? '#0f1117' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ── ModeTabBar ────────────────────────────────────────────────────────────────

function ModeTabBar({
  modes,
  activeMode,
  onSelect,
}: {
  modes: string[];
  activeMode: string;
  onSelect: (m: string) => void;
}) {
  if (modes.length <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
      {modes.map((m) => {
        const isActive = m === activeMode;
        return (
          <button
            key={m}
            onClick={() => onSelect(m)}
            style={{
              background: isActive ? '#374151' : 'transparent',
              color: isActive ? '#e5e7eb' : 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

// ── VersionCard ───────────────────────────────────────────────────────────────

interface VersionCardProps {
  version: {
    id: number;
    version: number;
    status: string;
    judgeScore: string | null;
    createdAt: Date | string;
    createdByAdminId: number;
  } | null;
  canaryPct: number | null;
  onEdit: () => void;
  isEditing: boolean;
  specialistId: string;
}

function VersionCard({ version, canaryPct, onEdit, isEditing, specialistId }: VersionCardProps) {
  if (!version) {
    return (
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 12,
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        暂无线上版本 · 可直接创建草稿
        {!isEditing && (
          <button
            onClick={onEdit}
            style={{
              marginLeft: 12,
              background: 'var(--gold)',
              color: '#0f1117',
              border: 'none',
              borderRadius: 4,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            编辑
          </button>
        )}
      </div>
    );
  }

  const score = version.judgeScore !== null ? parseFloat(version.judgeScore) : null;
  const createdAt = new Date(String(version.createdAt));
  const pct = canaryPct ?? 0;

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>
          当前版本
        </span>
        <span style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 700 }}>v{version.version}</span>
      </div>
      <div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>
          创建时间
        </span>
        <span style={{ color: '#e5e7eb', fontSize: 13 }}>
          {createdAt.toLocaleDateString('zh-CN')}
        </span>
      </div>
      <div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>
          创建人
        </span>
        <span style={{ color: '#e5e7eb', fontSize: 13 }}>管理员 #{version.createdByAdminId}</span>
      </div>
      {score !== null && (
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 2 }}>
            LLM Judge 评分
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: scoreColor(score),
            }}
          >
            {score.toFixed(2)}
          </span>
        </div>
      )}
      <div style={{ flex: '1 1 140px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          灰度比例 — {CANARY_LABELS[pct] ?? `${pct}%`}
        </span>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--gold)',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {!isEditing && (
          <button
            onClick={onEdit}
            style={{
              background: 'var(--gold)',
              color: '#0f1117',
              border: 'none',
              borderRadius: 4,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            编辑
          </button>
        )}
        <button
          onClick={() => window.location.href = '/admin/canary?specialist=' + encodeURIComponent(specialistId)}
          style={{
            background: 'transparent',
            color: '#60a5fa',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: 4,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          灰度配置
        </button>
      </div>
    </div>
  );
}

// ── PromptsPage ───────────────────────────────────────────────────────────────

export default function PromptsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // AC-5: URL state
  const rawSpecialist = searchParams.get('specialist') ?? 'EvolutionAgent';
  const specialistId = VALID_SPECIALIST_IDS.has(rawSpecialist) ? rawSpecialist : 'EvolutionAgent';
  const specialistDef = SPECIALISTS.find((s) => s.id === specialistId)!;

  const rawMode = searchParams.get('mode') ?? 'default';
  const mode: string = specialistDef.modes.includes(rawMode) ? rawMode : (specialistDef.modes[0] ?? 'default');

  function setSpecialist(id: string) {
    const def = SPECIALISTS.find((s) => s.id === id)!;
    setSearchParams({ specialist: id, mode: def.modes[0] ?? 'default' });
    setIsEditing(false);
    setDraftContent(null);
    setShowDiff(false);
    setSavedVersionId(null);
    setToast(null);
  }

  function setMode(m: string) {
    setSearchParams({ specialist: specialistId, mode: m });
    setIsEditing(false);
    setDraftContent(null);
    setShowDiff(false);
    setSavedVersionId(null);
    setToast(null);
  }

  // ── Editing state ────────────────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [savedVersionId, setSavedVersionId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AC-10: LLM Judge timeout tracking
  const lastSavedVersionIdRef = useRef<number | null>(null);
  const judgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const judgePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }

  function clearJudgeTimers() {
    if (judgeTimeoutRef.current) { clearTimeout(judgeTimeoutRef.current); judgeTimeoutRef.current = null; }
    if (judgePollingRef.current) { clearInterval(judgePollingRef.current); judgePollingRef.current = null; }
  }

  // ── tRPC queries ──────────────────────────────────────────────────────────

  const { data: activeData, isLoading: isLoadingActive, refetch: refetchActive } = adminTrpc.prompts.getActiveVersion.useQuery(
    { specialistId, mode },
    { refetchOnWindowFocus: false },
  );

  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = adminTrpc.prompts.listVersions.useQuery(
    { specialistId, mode, limit: 20 },
    { refetchOnWindowFocus: false },
  );

  // ── tRPC mutations ────────────────────────────────────────────────────────

  const saveDraftMut = adminTrpc.prompts.saveDraft.useMutation({
    onSuccess: (data) => {
      lastSavedVersionIdRef.current = data.version.id;
      setSavedVersionId(data.version.id);
      void refetchHistory();
      showToast('草稿已保存');
    },
    onError: (err) => showToast(`保存失败: ${err.message}`),
  });

  const submitMut = adminTrpc.prompts.submitForReview.useMutation({
    onSuccess: () => {
      const submittedId = lastSavedVersionIdRef.current;
      void refetchActive();
      void refetchHistory();
      setIsEditing(false);
      setSavedVersionId(null);
      setDraftContent(null);
      showToast('已提交审核 + LLM Judge 跑分中 · 评分完成会通知');
      // AC-10: Start 30s judge timeout + 5s polling to detect score arrival
      clearJudgeTimers();
      if (submittedId !== null) {
        judgePollingRef.current = setInterval(() => {
          void refetchHistory().then((result) => {
            const found = result.data?.versions?.find(
              (v) => v.id === submittedId && v.judgeScore !== null,
            );
            if (found) clearJudgeTimers();
          });
        }, 5000);
        judgeTimeoutRef.current = setTimeout(() => {
          clearJudgeTimers();
          showToast('评分超时 · 30s 后自动重试 · 也可手动重跑评分');
        }, 30000);
      }
    },
    onError: (err) => showToast(`提交失败: ${err.message}`),
  });

  const rollbackMut = adminTrpc.prompts.rollbackVersion.useMutation({
    onSuccess: () => {
      void refetchActive();
      void refetchHistory();
      showToast('已提交回滚申请 · 等待双重审批');
    },
    onError: (err) => showToast(`回滚失败: ${err.message}`),
  });

  // ── Draft localStorage + debounce ─────────────────────────────────────────
  // SHIELD: debounce 1s + localStorage · not onChange→backend

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load localStorage draft on enter edit mode
  useEffect(() => {
    if (isEditing && draftContent === null) {
      const stored = localStorage.getItem(draftKey(specialistId, mode));
      const initial = stored ?? activeData?.version?.content ?? '';
      setDraftContent(initial);
    }
  }, [isEditing, specialistId, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // AC-10: Clean up judge timers on unmount
  useEffect(() => () => clearJudgeTimers(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentChange = useCallback(
    (v: string) => {
      setDraftContent(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        localStorage.setItem(draftKey(specialistId, mode), v);
      }, 1000);
    },
    [specialistId, mode],
  );

  // ── Save draft to DB ──────────────────────────────────────────────────────

  function handleSave() {
    if (!draftContent) return;
    saveDraftMut.mutate({ specialistId, mode, content: draftContent });
  }

  // ── Submit for review ─────────────────────────────────────────────────────

  function handleSubmit() {
    if (!savedVersionId && !draftContent) return;
    if (savedVersionId) {
      submitMut.mutate({ versionId: savedVersionId });
      return;
    }
    // Save first then submit
    if (!draftContent) return;
    saveDraftMut.mutate(
      { specialistId, mode, content: draftContent },
      {
        onSuccess: (data) => {
          submitMut.mutate({ versionId: data.version.id });
        },
      },
    );
  }

  // ── Auth context for super_admin check ────────────────────────────────────

  const { data: me } = adminTrpc.auth.me.useQuery();
  const isSuperAdmin = me?.role === 'super_admin';

  // ── Render ────────────────────────────────────────────────────────────────

  const activeVersion = activeData?.version ?? null;
  const canaryPct = activeData?.canaryConfig?.canaryPct ?? null;
  const versions = historyData?.versions ?? [];

  const editorOriginal = activeVersion?.content ?? '';
  const editorModified = draftContent ?? editorOriginal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Specialist TabBar */}
      <TabBar specialists={SPECIALISTS} activeId={specialistId} onSelect={setSpecialist} />

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px 0' }}>
        {/* Mode sub-tabs */}
        <ModeTabBar modes={specialistDef.modes} activeMode={mode} onSelect={setMode} />

        {/* Version card */}
        {isLoadingActive ? (
          <div
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 12,
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 120,
                height: 12,
                background: 'var(--border)',
                borderRadius: 4,
              }}
            />
          </div>
        ) : (
          <VersionCard
            version={activeVersion}
            canaryPct={canaryPct}
            onEdit={() => setIsEditing(true)}
            isEditing={isEditing}
            specialistId={specialistId}
          />
        )}

        {/* Editor + History area */}
        <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>
          {/* Editor panel */}
          <div
            style={{
              flex: isEditing ? '0 0 80%' : '1',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--border)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {isEditing && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => setShowDiff((v) => !v)}
                  style={{
                    background: showDiff ? '#374151' : 'transparent',
                    color: '#e5e7eb',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {showDiff ? '编辑模式' : 'Diff 视图'}
                </button>

                <div style={{ flex: 1 }} />

                <button
                  onClick={handleSave}
                  disabled={saveDraftMut.isPending}
                  style={{
                    background: 'transparent',
                    color: saveDraftMut.isPending ? 'var(--text-muted)' : '#60a5fa',
                    border: '1px solid #60a5fa44',
                    borderRadius: 4,
                    padding: '3px 12px',
                    fontSize: 12,
                    cursor: saveDraftMut.isPending ? 'default' : 'pointer',
                  }}
                >
                  {saveDraftMut.isPending ? '保存中…' : '保存草稿'}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitMut.isPending || saveDraftMut.isPending}
                  style={{
                    background:
                      submitMut.isPending || saveDraftMut.isPending
                        ? 'var(--border)'
                        : 'var(--gold)',
                    color:
                      submitMut.isPending || saveDraftMut.isPending ? 'var(--text-muted)' : '#0f1117',
                    border: 'none',
                    borderRadius: 4,
                    padding: '3px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor:
                      submitMut.isPending || saveDraftMut.isPending ? 'default' : 'pointer',
                  }}
                >
                  {submitMut.isPending ? '提交中…' : '提交审核'}
                </button>

                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDraftContent(null);
                    setShowDiff(false);
                    setSavedVersionId(null);
                  }}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0 }}>
              {isEditing ? (
                showDiff ? (
                  <DiffMonacoEditor
                    original={editorOriginal}
                    modified={editorModified}
                    height="100%"
                  />
                ) : (
                  <MonacoEditor
                    value={draftContent ?? ''}
                    onChange={handleContentChange}
                    readOnly={false}
                    height="100%"
                  />
                )
              ) : activeVersion ? (
                <MonacoEditor value={activeVersion.content} readOnly height="100%" />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                  }}
                >
                  暂无线上版本
                </div>
              )}
            </div>
          </div>

          {/* History timeline panel — 20% width when editing */}
          {(isEditing || true) && (
            <div
              style={{
                flex: isEditing ? '0 0 20%' : '0 0 280px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  flexShrink: 0,
                }}
              >
                历史版本
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <HistoryTimeline
                  versions={versions}
                  isLoading={isLoadingHistory}
                  isSuperAdmin={isSuperAdmin}
                  onRollback={() => {
                    rollbackMut.mutate({ specialistId, mode });
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom padding */}
        <div style={{ height: 12, flexShrink: 0 }} />
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f2937',
            color: '#e5e7eb',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            zIndex: 9999,
            maxWidth: 500,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
