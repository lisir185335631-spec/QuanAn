// PRD-28 US-007 · Inter-rater agreement page (D-270 字面锁)
// AC-1/2/3/6/7/8: 30 sample hand-scoring UI + Cohen's kappa + Pearson
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { adminTrpc } from '../../lib/admin-client';

type Sample = {
  id: number;
  goldenId: string;
  specialistId: string;
  mode: string | null;
  input: unknown;
  actualOutput: unknown;
  criteria: string[];
  judgeScore: number;
  judgeReason: string;
  humanScore: number | null;
  humanScoredAt: Date | null;
};

function jsonPretty(val: unknown): string {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function ScoreLabel({ score }: { score: number }) {
  const color = score >= 6 ? '#86efac' : score >= 4 ? '#fde68a' : '#fca5a5';
  return (
    <span style={{ color, fontWeight: 700, fontSize: 15 }}>
      {score} / 10
    </span>
  );
}

export default function InterRaterPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [sliderVal, setSliderVal] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const utils = adminTrpc.useUtils();

  const { data, isLoading, error } = adminTrpc.evaluation.listInterRaterSubset.useQuery(
    { runId: runId ?? '' },
    { enabled: !!runId },
  );

  const { data: agreement } = adminTrpc.evaluation.computeAgreement.useQuery(
    { runId: runId ?? '' },
    {
      enabled: !!data && data.totalRated === data.totalSubset && data.totalSubset > 0,
    },
  );

  const submitMutation = adminTrpc.evaluation.submitHumanScore.useMutation({
    onSuccess: async () => {
      await utils.evaluation.listInterRaterSubset.invalidate({ runId: runId ?? '' });
      await utils.evaluation.computeAgreement.invalidate({ runId: runId ?? '' });
      setComment('');
      setSliderVal(5);
      setSubmitting(false);
      // Advance to next unrated sample
      const samples = data?.samples ?? [];
      const nextUnrated = samples.findIndex(
        (s, i) => i > currentIdx && s.humanScore === null,
      );
      if (nextUnrated !== -1) {
        setCurrentIdx(nextUnrated);
      } else {
        // Try from beginning
        const firstUnrated = samples.findIndex((s) => s.humanScore === null);
        if (firstUnrated !== -1 && firstUnrated !== currentIdx) {
          setCurrentIdx(firstUnrated);
        }
      }
    },
    onError: () => setSubmitting(false),
  });

  if (!runId) {
    return <div style={{ color: 'var(--text-dim)', padding: 24 }}>runId 缺失</div>;
  }

  if (isLoading) {
    return <div style={{ color: 'var(--text-dim)', padding: 24 }}>加载中...</div>;
  }

  if (error ?? !data) {
    return (
      <div style={{ color: '#fca5a5', padding: 24 }}>
        加载失败: {error?.message ?? '未知错误'}
      </div>
    );
  }

  const samples: Sample[] = (data.samples as Sample[]) ?? [];
  const totalSubset = data.totalSubset;
  const totalRated = samples.filter((s) => s.humanScore !== null).length;
  const allDone = totalRated >= totalSubset && totalSubset > 0;

  const current = samples[currentIdx] as Sample | undefined;

  function handleSubmit() {
    if (!current) return;
    setSubmitting(true);
    submitMutation.mutate({
      sampleId: current.id,
      humanScore: sliderVal,
      humanComment: comment || undefined,
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/admin/evaluation/${runId}`)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ← 返回详情
        </button>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
          🔍 Inter-rater Agreement
        </h1>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto' }}>
          {runId}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          进度 {totalRated}/{totalSubset} 评完
        </span>
        <div
          style={{
            flex: 1,
            height: 6,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${totalSubset > 0 ? (totalRated / totalSubset) * 100 : 0}%`,
              height: '100%',
              background: 'var(--gold)',
              transition: 'width 0.3s',
            }}
          />
        </div>
        {allDone && agreement && (
          <span style={{ fontSize: 12, color: '#86efac', fontWeight: 600 }}>
            κ={agreement.kappa.toFixed(3)} · r={agreement.pearson.toFixed(3)} ·{' '}
            {agreement.interpretation}
          </span>
        )}
      </div>

      {/* Sample nav dots */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginBottom: 16,
        }}
      >
        {samples.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentIdx(i)}
            title={`Sample ${i + 1} — goldenId: ${s.goldenId}`}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: i === currentIdx ? '2px solid var(--gold)' : '1px solid var(--border)',
              background:
                s.humanScore !== null
                  ? '#166534'
                  : i === currentIdx
                    ? 'var(--bg-card)'
                    : 'transparent',
              cursor: 'pointer',
              fontSize: 10,
              color: 'var(--text-dim)',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current sample card */}
      {current ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
          }}
        >
          {/* Sample meta */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
              fontSize: 12,
              color: 'var(--text-dim)',
            }}
          >
            <span>
              Sample {currentIdx + 1} / {totalSubset}
            </span>
            <span>goldenId: {current.goldenId}</span>
            <span>specialist: {current.specialistId.replace('Agent', '')}</span>
            {current.mode && <span>mode: {current.mode}</span>}
          </div>

          {/* Input */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Input
            </div>
            <pre
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 10px',
                fontSize: 11,
                color: 'var(--text-muted)',
                overflow: 'auto',
                maxHeight: 160,
                margin: 0,
              }}
            >
              {jsonPretty(current.input)}
            </pre>
          </div>

          {/* Actual Output */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Actual Output
            </div>
            <pre
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '8px 10px',
                fontSize: 11,
                color: 'var(--text-muted)',
                overflow: 'auto',
                maxHeight: 200,
                margin: 0,
              }}
            >
              {jsonPretty(current.actualOutput)}
            </pre>
          </div>

          {/* Criteria */}
          {current.criteria.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Criteria
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                {current.criteria.map((c, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LLM Judge score + reason */}
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '10px 12px',
              marginBottom: 16,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>LLM Judge Score:</span>
              <ScoreLabel score={current.judgeScore} />
            </div>
            <div style={{ color: 'var(--text-dim)', lineHeight: 1.5 }}>
              {current.judgeReason}
            </div>
          </div>

          {/* Already rated */}
          {current.humanScore !== null && (
            <div
              style={{
                background: '#14532d33',
                border: '1px solid #166534',
                borderRadius: 4,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 12,
                color: '#86efac',
              }}
            >
              已评: {current.humanScore} / 10
            </div>
          )}

          {/* Slider */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                Human Score: {sliderVal} / 10
              </span>
              <span style={{ color: sliderVal >= 6 ? '#86efac' : '#fca5a5', fontSize: 11 }}>
                {sliderVal >= 6 ? 'Pass' : 'Fail'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--text-dim)',
                marginTop: 2,
              }}
            >
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i}>{i}</span>
              ))}
            </div>
          </div>

          {/* Comment textarea */}
          <textarea
            placeholder="注释（可选）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text-muted)',
              fontSize: 12,
              padding: '6px 8px',
              resize: 'vertical',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              style={{
                background: 'var(--gold)',
                color: '#000',
                border: 'none',
                borderRadius: 4,
                padding: '8px 20px',
                fontWeight: 700,
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? '提交中...' : '提交评分'}
            </button>
            {currentIdx < samples.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(i + 1, samples.length - 1))}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: 4,
                  padding: '8px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                跳过 →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text-dim)', padding: 24, textAlign: 'center' }}>
          暂无样本
        </div>
      )}

      {/* Agreement result when all done */}
      {allDone && agreement && (
        <div
          style={{
            marginTop: 20,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 14 }}>
            🎯 Agreement 结果 ({agreement.ratedCount}/{agreement.totalSubset} 样本)
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                Cohen&apos;s κ (categorical)
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: agreement.kappa >= 0.4 ? '#86efac' : '#fca5a5' }}>
                {agreement.kappa.toFixed(3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                Pearson r (continuous)
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
                {agreement.pearson.toFixed(3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                Interpretation
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: agreement.kappa >= 0.4 ? '#86efac' : '#fde68a',
                  textTransform: 'capitalize',
                }}
              >
                {agreement.interpretation}
                {agreement.kappa < 0.4 && ' (below threshold κ≥0.4)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
