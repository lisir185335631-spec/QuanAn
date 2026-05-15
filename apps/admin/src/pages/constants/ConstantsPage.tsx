// PRD-14 US-009 · ConstantsPage · /admin/constants
// AC-2: 3 Tab(知识案例/公式/元素) + URL state useSearchParams (SHIELD: not useState)
// AC-3: constantKey 下拉 · 选中后展示当前 active 版本
// AC-4: 当前版本卡片 · 版本号 + 创建时间 + 创建人 + LLM Judge 评分 + 当前灰度比例
// AC-5: 复用 PRD-13 US-007 MonacoEditor.tsx (lazy import · language='json')
// AC-6: Diff 模式按钮
// AC-7: debounce 1s localStorage key='constant_draft_${constantType}_${constantKey}'
// AC-8: 保存草稿(status='draft') · 提交审核(→'pending_review' + LLM Judge + dual approval)
// AC-9: HistoryTimeline · 回滚此版本(super_admin · dual approval)
// SHIELD: Monaco lazy import (anti_pattern #1)
// SHIELD: URL state via useSearchParams (anti_pattern #2)
// SHIELD: debounce 1s + localStorage · not onChange→backend (anti_pattern #3)

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';
import { DiffMonacoEditor, MonacoEditor } from '../prompts/components/MonacoEditor';
import { ConstantKeyDropdown } from './components/ConstantKeyDropdown';
import { HistoryTimeline } from './components/HistoryTimeline';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConstantType = 'case' | 'formula' | 'element';

interface TabDef {
  type: ConstantType;
  label: string;
  count: string;
}

const TABS: TabDef[] = [
  { type: 'case', label: '知识案例', count: '67' },
  { type: 'formula', label: '公式', count: '23' },
  { type: 'element', label: '元素', count: '22' },
];

const VALID_TYPES = new Set<string>(TABS.map((t) => t.type));

function draftKey(constantType: string, constantKey: string): string {
  return `constant_draft_${constantType}_${constantKey}`;
}

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

// ── TabBar ────────────────────────────────────────────────────────────────────

function TabBar({
  tabs,
  activeType,
  onSelect,
}: {
  tabs: TabDef[];
  activeType: ConstantType;
  onSelect: (type: ConstantType) => void;
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
      {tabs.map((tab) => {
        const isActive = tab.type === activeType;
        return (
          <button
            key={tab.type}
            onClick={() => onSelect(tab.type)}
            style={{
              background: isActive ? 'var(--gold)' : 'transparent',
              color: isActive ? '#0f1117' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {tab.label}
            <span
              style={{
                marginLeft: 4,
                fontSize: 10,
                color: isActive ? '#0f1117' : 'var(--text-muted)',
                opacity: 0.7,
              }}
            >
              {tab.count}
            </span>
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
  constantType: string;
  constantKey: string;
}

function VersionCard({ version, canaryPct, onEdit, isEditing, constantType, constantKey }: VersionCardProps) {
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
          <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(score) }}>
            {score.toFixed(2)}
          </span>
        </div>
      )}
      <div style={{ flex: '1 1 140px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>
          灰度比例 — {CANARY_LABELS[pct] ?? `${pct}%`}
        </span>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
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
          onClick={() =>
            window.location.href = `/admin/approvals?type=constant&key=${encodeURIComponent(constantType + ':' + constantKey)}`
          }
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

// ── ConstantsPage ─────────────────────────────────────────────────────────────

export default function ConstantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // AC-2: URL state (SHIELD: useSearchParams · not useState)
  const rawType = searchParams.get('type') ?? 'case';
  const constantType: ConstantType = VALID_TYPES.has(rawType) ? (rawType as ConstantType) : 'case';

  const tabDef = TABS.find((t) => t.type === constantType)!;
  const firstKey = constantType === 'case' ? 'opinion_beauty_01' : constantType === 'formula' ? 'pain_hook' : 'greed';
  const rawKey = searchParams.get('key') ?? firstKey;
  const constantKey = rawKey || firstKey;

  function setType(type: ConstantType) {
    const defaultKey = type === 'case' ? 'opinion_beauty_01' : type === 'formula' ? 'pain_hook' : 'greed';
    setSearchParams({ type, key: defaultKey });
    setIsEditing(false);
    setDraftContent(null);
    setShowDiff(false);
    setSavedVersionId(null);
    setToast(null);
  }

  function setKey(key: string) {
    setSearchParams({ type: constantType, key });
    setIsEditing(false);
    setDraftContent(null);
    setShowDiff(false);
    setSavedVersionId(null);
    setToast(null);
  }

  // ── Editing state ─────────────────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [savedVersionId, setSavedVersionId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedVersionIdRef = useRef<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }

  // ── tRPC queries ───────────────────────────────────────────────────────────

  const { data: activeData, isLoading: isLoadingActive, refetch: refetchActive } =
    adminTrpc.constants.getActiveVersion.useQuery(
      { constantType, constantKey },
      { refetchOnWindowFocus: false, enabled: Boolean(constantKey) },
    );

  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } =
    adminTrpc.constants.listVersions.useQuery(
      { constantType, constantKey, limit: 20 },
      { refetchOnWindowFocus: false, enabled: Boolean(constantKey) },
    );

  // ── tRPC mutations ─────────────────────────────────────────────────────────

  const saveDraftMut = adminTrpc.constants.saveDraft.useMutation({
    onSuccess: (data) => {
      lastSavedVersionIdRef.current = data.version.id;
      setSavedVersionId(data.version.id);
      void refetchHistory();
      showToast('草稿已保存');
    },
    onError: (err) => showToast(`保存失败: ${err.message}`),
  });

  const submitMut = adminTrpc.constants.submitForReview.useMutation({
    onSuccess: () => {
      void refetchActive();
      void refetchHistory();
      setIsEditing(false);
      setSavedVersionId(null);
      setDraftContent(null);
      showToast('已提交 + LLM Judge 跑分中');
    },
    onError: (err) => showToast(`提交失败: ${err.message}`),
  });

  const rollbackMut = adminTrpc.constants.rollbackVersion.useMutation({
    onSuccess: () => {
      void refetchActive();
      void refetchHistory();
      showToast('已提交回滚申请 · 等待双重审批');
    },
    onError: (err) => showToast(`回滚失败: ${err.message}`),
  });

  // ── Draft localStorage + debounce 1s ─────────────────────────────────────
  // SHIELD: debounce 1s + localStorage · not onChange→backend (anti_pattern #3)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditing && draftContent === null) {
      const stored = localStorage.getItem(draftKey(constantType, constantKey));
      const initial = stored ?? activeData?.version?.content ?? '{}';
      setDraftContent(initial);
    }
  }, [isEditing, constantType, constantKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContentChange = useCallback(
    (v: string) => {
      setDraftContent(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        localStorage.setItem(draftKey(constantType, constantKey), v);
      }, 1000);
    },
    [constantType, constantKey],
  );

  function handleSave() {
    if (!draftContent) return;
    saveDraftMut.mutate({ constantType, constantKey, content: draftContent });
  }

  function handleSubmit() {
    if (!savedVersionId && !draftContent) return;
    if (savedVersionId) {
      submitMut.mutate({ versionId: savedVersionId });
      return;
    }
    if (!draftContent) return;
    saveDraftMut.mutate(
      { constantType, constantKey, content: draftContent },
      {
        onSuccess: (data) => {
          submitMut.mutate({ versionId: data.version.id });
        },
      },
    );
  }

  // ── Auth context ──────────────────────────────────────────────────────────

  const { data: me } = adminTrpc.auth.me.useQuery();
  const isSuperAdmin = me?.role === 'super_admin';

  // ── Render ────────────────────────────────────────────────────────────────

  const activeVersion = activeData?.version ?? null;
  const canaryPct = activeData?.canaryConfig?.canaryPct ?? null;
  const versions = historyData?.versions ?? [];

  const editorOriginal = activeVersion?.content ?? '{}';
  const editorModified = draftContent ?? editorOriginal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 3-Tab top bar (知识案例 / 公式 / 元素) */}
      <TabBar tabs={TABS} activeType={constantType} onSelect={setType} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px 0' }}>
        {/* Tab label + description */}
        <div style={{ marginBottom: 10, flexShrink: 0 }}>
          <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>
            {tabDef.label}
            <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              ({tabDef.count} 项)
            </span>
          </span>
        </div>

        {/* constantKey dropdown (AC-3/AC-11) */}
        <ConstantKeyDropdown
          constantType={constantType}
          selectedKey={constantKey}
          onSelect={setKey}
        />

        {/* Version card (AC-4) */}
        {isLoadingActive ? (
          <div
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 12,
              flexShrink: 0,
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
            constantType={constantType}
            constantKey={constantKey}
          />
        )}

        {/* Editor + History area */}
        <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>
          {/* Monaco editor panel (AC-5 / AC-6) */}
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
                  {saveDraftMut.isPending ? '保存中…' : '保存'}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitMut.isPending || saveDraftMut.isPending}
                  style={{
                    background:
                      submitMut.isPending || saveDraftMut.isPending ? 'var(--border)' : 'var(--gold)',
                    color:
                      submitMut.isPending || saveDraftMut.isPending ? 'var(--text-muted)' : '#0f1117',
                    border: 'none',
                    borderRadius: 4,
                    padding: '3px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: submitMut.isPending || saveDraftMut.isPending ? 'default' : 'pointer',
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
                    language="json"
                  />
                )
              ) : activeVersion ? (
                <MonacoEditor value={activeVersion.content} readOnly height="100%" language="json" />
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
                  暂无线上版本 · 点击"编辑"创建草稿
                </div>
              )}
            </div>
          </div>

          {/* History timeline panel (AC-9) */}
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
                constantType={constantType}
                constantKey={constantKey}
                onRollback={() => {
                  rollbackMut.mutate({ constantType, constantKey });
                }}
              />
            </div>
          </div>
        </div>

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
