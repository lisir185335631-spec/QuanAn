// PRD-14 US-010 · LlmJudgeCard (constants) — 评分进度条 + 重跑按钮
// AC-7: 复用 PRD-13 US-008 · 显示 0.00-5.00 评分 + 跑分时间 + isMock badge + 重跑评分按钮

import { useState } from 'react';

import { adminTrpc } from '../../../lib/admin-client';

interface LlmJudgeCardProps {
  versionId: number | null;
  judgeScore: string | null;
  isSuperAdmin: boolean;
  onScoreUpdated?: (score: number) => void;
  onToast: (msg: string) => void;
}

function scoreColor(score: number): string {
  if (score >= 4.0) return '#22c55e';
  if (score >= 3.5) return '#d4af37';
  return '#ef4444';
}

export function LlmJudgeCard({
  versionId,
  judgeScore,
  isSuperAdmin,
  onScoreUpdated,
  onToast,
}: LlmJudgeCardProps) {
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [displayScore, setDisplayScore] = useState<number | null>(
    judgeScore !== null ? parseFloat(judgeScore) : null,
  );
  const [isMockResult, setIsMockResult] = useState(true);

  const runJudgeMut = adminTrpc.constants.runLlmJudge.useMutation({
    onSuccess: (data) => {
      setDisplayScore(data.score);
      setIsMockResult(data.isMock);
      setLastRunAt(new Date(String(data.runAt)));
      onScoreUpdated?.(data.score);
      onToast(`LLM Judge 评分完成 · ${data.score.toFixed(2)} 分${data.isMock ? ' (Mock)' : ''}`);
    },
    onError: (err) => onToast(`评分失败: ${err.message}`),
  });

  const score = displayScore ?? (judgeScore !== null ? parseFloat(judgeScore) : null);
  const pct = score !== null ? (score / 5) * 100 : 0;

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          LLM Judge 评分
        </span>
        {isMockResult && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid var(--border)',
              borderRadius: 3,
              padding: '1px 6px',
            }}
          >
            isMock
          </span>
        )}
      </div>

      {score !== null ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: scoreColor(score),
                lineHeight: 1,
              }}
            >
              {score.toFixed(2)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 5.00</span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: '#1f2937',
              overflow: 'hidden',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: scoreColor(score),
                transition: 'width 0.5s ease',
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {lastRunAt && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                最近跑分: {lastRunAt.toLocaleString('zh-CN')}
              </span>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              模型: claude-sonnet (isMock stub)
            </span>
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          暂无评分 · 点击重跑获取
        </div>
      )}

      {isSuperAdmin && versionId !== null && (
        <button
          onClick={() => runJudgeMut.mutate({ versionId, isMock: true })}
          disabled={runJudgeMut.isPending}
          style={{
            background: runJudgeMut.isPending ? 'var(--border)' : 'transparent',
            color: runJudgeMut.isPending ? 'var(--text-muted)' : '#60a5fa',
            border: '1px solid rgba(96,165,250,0.4)',
            borderRadius: 4,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 600,
            cursor: runJudgeMut.isPending ? 'default' : 'pointer',
          }}
        >
          {runJudgeMut.isPending ? '评分中…' : '重跑评分'}
        </button>
      )}
    </div>
  );
}
