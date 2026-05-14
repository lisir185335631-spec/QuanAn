// PRD-14 US-005 · ExperimentDetailPage
// AC-1: /admin/ab-experiments/:experimentKey 独立页
// AC-2: 4 KPI + variant 标签 + 流量占比
// AC-3: 转化率 BarChart + ErrorBar CI
// AC-4: 7日留存 LineChart · 3 variant × 7天
// AC-5: 平均 LLM 成本 BarChart + sample size 标注
// AC-6: 每 chart 下方显著性结论文字
// AC-7: ExperimentTimeline AreaChart · 累积 sample
// AC-8: 操作面板 · 升 winner(dual approval) + 一键停损(super_admin) + 导出 PDF
// AC-9: ExperimentReportPdf @react-pdf/renderer 4.5.1 · PDFDownloadLink
// SHIELD: ErrorBar 用内置组件 <ErrorBar dataKey='ciError' /> 不手画
// SHIELD: setInterval 30s polling (不 WebSocket)

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';

import { adminTrpc } from '../../lib/admin-client';
import { ExperimentTimeline } from './ExperimentTimeline';
import { ExperimentReportPdf } from './ExperimentReportPdf';

// ── Constants ──────────────────────────────────────────────────────────────

const VARIANT_COLORS: Record<string, string> = {
  control: '#d4af37',
  variant_a: '#22c55e',
  variant_b: '#3b82f6',
};

const VARIANT_LABELS: Record<string, string> = {
  control: 'Control',
  variant_a: 'Variant A',
  variant_b: 'Variant B',
};

const METRIC_LABELS: Record<string, string> = {
  conversion: '转化率',
  retention: '7日留存',
  cost: '平均成本',
};

const REC_COLOR: Record<string, string> = {
  stop_winner: '#22c55e',
  stop_loser: '#ef4444',
  continue: '#f59e0b',
  inconclusive: '#6b7280',
};

const REC_LABEL: Record<string, string> = {
  stop_winner: '显著优胜',
  stop_loser: '显著劣于',
  continue: '继续观察',
  inconclusive: '样本不足',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(String(d)).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '14px 16px',
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: 'var(--gold)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const SectionTitle = ({ label }: { label: string }) => (
  <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 10 }}>
    {label}
  </div>
);

function SignificanceConclusion({ metric, variants, significanceResults }: {
  metric: 'conversion' | 'retention' | 'cost';
  variants: Record<string, { conversion: { rate: number; ciLow: number; ciHigh: number }; avgCost: number; sampleSize: number }>;
  significanceResults: Array<{ metric: string; pValue: number | null; isSignificant: boolean; effect: number | null; recommendation: string }>;
}) {
  const sig = significanceResults.find((r) => r.metric === metric);
  if (!sig) return null;

  const controlRate = metric === 'cost'
    ? (variants['control']?.avgCost ?? 0)
    : (variants['control']?.conversion.rate ?? 0);
  const variantARate = metric === 'cost'
    ? (variants['variant_a']?.avgCost ?? 0)
    : (variants['variant_a']?.conversion.rate ?? 0);

  const metricLabel = METRIC_LABELS[metric] ?? metric;
  const recColor = REC_COLOR[sig.recommendation] ?? '#6b7280';
  const recLabel = REC_LABEL[sig.recommendation] ?? sig.recommendation;
  const pValStr = sig.pValue != null ? sig.pValue.toFixed(3) : 'N/A';

  let text = '';
  if (metric === 'cost') {
    text = `Variant A 平均成本 $${variantARate.toFixed(4)} vs Control $${controlRate.toFixed(4)} · p-value=${pValStr} · ${sig.isSignificant ? '显著' : '不显著'} · 推荐: ${recLabel}`;
  } else {
    text = `Variant A ${metricLabel} ${fmtPct(variantARate)} vs Control ${fmtPct(controlRate)} · p-value=${pValStr} · ${sig.isSignificant ? '显著' : '不显著'} · 推荐: ${recLabel}`;
  }

  return (
    <div style={{ fontSize: 11, color: recColor, marginTop: 8, padding: '6px 10px', background: `${recColor}11`, borderRadius: 4, borderLeft: `3px solid ${recColor}` }}>
      {text}
    </div>
  );
}

// ── PromoteWinnerModal ─────────────────────────────────────────────────────

function PromoteWinnerModal({
  experimentId,
  experimentKey,
  onClose,
  onSubmitted,
}: {
  experimentId: number;
  experimentKey: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [winner, setWinner] = useState<'control' | 'variant_a' | 'variant_b'>('variant_a');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const promoteMutation = adminTrpc.abExperiments.promoteWinner.useMutation();

  async function handleSubmit() {
    try {
      const result = await promoteMutation.mutateAsync({
        experimentId,
        winnerVariant: winner,
        reason,
      });
      onSubmitted();
      onClose();
      alert(`审批请求已创建 (ID: ${result.approvalRequestId})，等待 dual approval 通过后生效。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 28px', width: 420 }}>
        <h4 style={{ color: 'var(--gold)', fontSize: 15, marginBottom: 12 }}>升 Winner 到 100%</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          实验 <strong>{experimentKey}</strong> — 选择胜出 variant 发起 dual approval：
        </p>
        <select
          value={winner}
          onChange={(e) => setWinner(e.target.value as typeof winner)}
          style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 10px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 12 }}
        >
          <option value="control">Control</option>
          <option value="variant_a">Variant A</option>
          <option value="variant_b">Variant B</option>
        </select>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(null); }}
          rows={3}
          placeholder="升 winner 原因（可选）..."
          style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
        />
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
            取消
          </button>
          <button
            onClick={() => { void handleSubmit(); }}
            disabled={promoteMutation.isPending}
            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: promoteMutation.isPending ? 'not-allowed' : 'pointer', opacity: promoteMutation.isPending ? 0.6 : 1 }}
          >
            {promoteMutation.isPending ? '提交中…' : '发起审批'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── StopConfirmModal ───────────────────────────────────────────────────────

function StopConfirmModal({
  experimentId,
  experimentKey,
  onClose,
  onStopped,
}: {
  experimentId: number;
  experimentKey: string;
  onClose: () => void;
  onStopped: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stopMutation = adminTrpc.abExperiments.stop.useMutation();

  async function handleStop() {
    if (reason.length < 20) { setError('停损理由至少 20 个字'); return; }
    try {
      await stopMutation.mutateAsync({ experimentId, stopReason: reason });
      onStopped();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '停损失败');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg-surface)', border: '1px solid #ef444455', borderRadius: 8, padding: '24px 28px', width: 440 }}>
        <h4 style={{ color: '#ef4444', fontSize: 15, marginBottom: 8 }}>⚠ 一键停损确认</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
          实验 <strong>{experimentKey}</strong> 将立即停损，不可逆。请填写停损理由（≥ 20 字）：
        </p>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(null); }}
          rows={4}
          placeholder="停损原因，例如：指标恶化超过阈值，variant_a 转化率下降 35%..."
          style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{reason.length} / 20 最低</div>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
            取消
          </button>
          <button
            onClick={() => { void handleStop(); }}
            disabled={stopMutation.isPending}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: stopMutation.isPending ? 'not-allowed' : 'pointer', opacity: stopMutation.isPending ? 0.6 : 1 }}
          >
            {stopMutation.isPending ? '停损中…' : '确认停损'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ExperimentDetailPage ───────────────────────────────────────────────────

export default function ExperimentDetailPage() {
  const { experimentKey } = useParams<{ experimentKey: string }>();
  const navigate = useNavigate();
  const { data: me } = adminTrpc.auth.me.useQuery();
  const currentRole = me?.role;

  const [showPromote, setShowPromote] = useState(false);
  const [showStop, setShowStop] = useState(false);

  const {
    data: detail,
    refetch: refetchDetail,
    isError,
    error,
  } = adminTrpc.abExperiments.getDetailByKey.useQuery(
    { experimentKey: experimentKey ?? '' },
    { enabled: !!experimentKey },
  );

  const { data: variantMetrics, refetch: refetchMetrics } =
    adminTrpc.abExperiments.getVariantMetrics.useQuery(
      { experimentId: detail?.id ?? 0 },
      { enabled: !!detail?.id },
    );

  const { data: cumulativeData, refetch: refetchTimeline } =
    adminTrpc.abExperiments.getCumulativeTimeline.useQuery(
      { experimentId: detail?.id ?? 0 },
      { enabled: !!detail?.id },
    );

  const { data: multiMetric, refetch: refetchMulti } =
    adminTrpc.abExperiments.getMultiMetric.useQuery(
      { experimentId: detail?.id ?? 0 },
      { enabled: !!detail?.id && detail.status === 'running' },
    );

  const refetchAll = useCallback(() => {
    void refetchDetail();
    void refetchMetrics();
    void refetchTimeline();
    void refetchMulti();
  }, [refetchDetail, refetchMetrics, refetchTimeline, refetchMulti]);

  // 30s polling
  useEffect(() => {
    const id = setInterval(refetchAll, 30_000);
    return () => clearInterval(id);
  }, [refetchAll]);

  if (!experimentKey) return null;

  if (isError) {
    return (
      <div style={{ padding: '40px 28px', color: 'var(--text-muted)', textAlign: 'center' }}>
        实验不存在或加载失败: {error instanceof Error ? error.message : '未知错误'}
        <br />
        <button onClick={() => navigate('/admin/ab-experiments')} style={{ marginTop: 16, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          ← 返回实验列表
        </button>
      </div>
    );
  }

  if (!detail) {
    return <div style={{ padding: '40px 28px', color: 'var(--text-muted)' }}>加载中…</div>;
  }

  const trafficAlloc = detail.trafficAllocation as Record<string, number> | null;
  const variants = variantMetrics?.variants ?? {};
  const sigResults = multiMetric?.results ?? [];
  const timeline = cumulativeData?.timeline ?? [];

  // Determine recommended action from significance
  const topRec = sigResults.find((r) => r.recommendation === 'stop_winner')
    ?? sigResults.find((r) => r.recommendation === 'stop_loser');
  const recText = topRec ? (REC_LABEL[topRec.recommendation] ?? '—') : '继续观察';

  // Worst effect for stop-loss distance
  const effects = sigResults.filter((r) => r.effect != null).map((r) => r.effect as number);
  const minEffect = effects.length > 0 ? Math.min(...effects) : null;
  const stopLossThreshold = -0.3;
  const distToStop = minEffect != null ? Math.round((minEffect - stopLossThreshold) * 100) : null;

  // Build conversion chart data
  const convChartData = (['control', 'variant_a', 'variant_b'] as const).map((v) => {
    const vm = variants[v];
    const rate = vm?.conversion.rate ?? 0;
    const ciLow = vm?.conversion.ciLow ?? 0;
    const ciHigh = vm?.conversion.ciHigh ?? 0;
    return {
      name: VARIANT_LABELS[v],
      variant: v,
      rate: parseFloat((rate * 100).toFixed(2)),
      ciError: [
        parseFloat(((rate - ciLow) * 100).toFixed(2)),
        parseFloat(((ciHigh - rate) * 100).toFixed(2)),
      ] as [number, number],
    };
  });

  // Build cost chart data
  const costChartData = (['control', 'variant_a', 'variant_b'] as const).map((v) => {
    const vm = variants[v];
    return {
      name: VARIANT_LABELS[v],
      variant: v,
      avgCost: parseFloat((vm?.avgCost ?? 0).toFixed(6)),
      sampleSize: vm?.sampleSize ?? 0,
    };
  });

  // Build retention line chart data
  const retentionData = [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const point: Record<string, number | string> = { day: `Day ${day}` };
    for (const v of ['control', 'variant_a', 'variant_b'] as const) {
      const ret = variants[v]?.retention.find((r) => r.day === day);
      point[v] = parseFloat(((ret?.rate ?? 0) * 100).toFixed(1));
    }
    return point;
  });

  // PDF data
  const pdfData = {
    experimentKey: detail.experimentKey,
    name: detail.name,
    status: detail.status,
    startedAt: detail.startedAt,
    stoppedAt: detail.stoppedAt,
    createdAt: detail.createdAt,
    sampleSize: detail.sampleSize,
    trafficAllocation: trafficAlloc,
    variants: Object.fromEntries(
      (['control', 'variant_a', 'variant_b'] as const).map((v) => [
        v,
        variants[v] ?? { sampleSize: 0, conversion: { rate: 0, ciLow: 0, ciHigh: 0 }, retention: [], avgCost: 0 },
      ]),
    ),
    significanceResults: sigResults,
    generatedBy: me?.email ?? 'admin',
  };

  const pdfFileName = `ab-experiment-${detail.experimentKey}-${new Date().toISOString().slice(0, 7)}.pdf`;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <button
            onClick={() => navigate('/admin/ab-experiments')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 6 }}
          >
            ← 实验列表
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, margin: 0 }}>
              🧪 {detail.name}
            </h2>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
              {detail.experimentKey}
            </span>
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          创建: {fmtDate(detail.createdAt)}
        </span>
      </div>

      {/* 4 KPI cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="当前 Sample" value={detail.sampleSize.toLocaleString()} />
        <KpiCard label="当前阶段" value={detail.status} />
        <KpiCard label="推荐操作" value={recText} sub={`基于显著性检验`} />
        {distToStop != null && (
          <KpiCard
            label="距停损阈值"
            value={distToStop >= 0 ? `${distToStop}%` : '⚠ 超阈值'}
            sub={`阈值: ${Math.abs(stopLossThreshold * 100)}% 恶化`}
          />
        )}
      </div>

      {/* Variant labels + traffic allocation */}
      {trafficAlloc && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['control', 'variant_a', 'variant_b'] as const).map((v) => (
            <div
              key={v}
              style={{
                background: `${VARIANT_COLORS[v]}22`,
                border: `1px solid ${VARIANT_COLORS[v]}55`,
                borderRadius: 6,
                padding: '8px 14px',
                flex: 1,
                minWidth: 100,
              }}
            >
              <div style={{ color: VARIANT_COLORS[v], fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                {VARIANT_LABELS[v]}
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
                {trafficAlloc[v] ?? 0}%
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>
                n={variants[v]?.sampleSize.toLocaleString() ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Conversion BarChart */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 14px' }}>
          <SectionTitle label="转化率 (3 Variant)" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={convChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                formatter={(value) => [`${String(value)}%`, '转化率']}
              />
              <Bar dataKey="rate" name="转化率" radius={[3, 3, 0, 0]}>
                {convChartData.map((entry, idx) => (
                  <Cell key={idx} fill={VARIANT_COLORS[entry.variant] ?? '#6b7280'} />
                ))}
                {/* SHIELD: ErrorBar 用内置组件 */}
                <ErrorBar dataKey="ciError" direction="y" stroke="#888" strokeWidth={1.5} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <SignificanceConclusion metric="conversion" variants={variants as Parameters<typeof SignificanceConclusion>[0]['variants']} significanceResults={sigResults} />
        </div>

        {/* 7-day Retention LineChart */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 14px' }}>
          <SectionTitle label="7 日留存率" />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={retentionData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                formatter={(value, name) => [`${String(value)}%`, VARIANT_LABELS[name as string] ?? String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => VARIANT_LABELS[v] ?? v} />
              {(['control', 'variant_a', 'variant_b'] as const).map((v) => (
                <Line
                  key={v}
                  type="monotone"
                  dataKey={v}
                  stroke={VARIANT_COLORS[v]}
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: VARIANT_COLORS[v] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <SignificanceConclusion metric="retention" variants={variants as Parameters<typeof SignificanceConclusion>[0]['variants']} significanceResults={sigResults} />
        </div>
      </div>

      {/* Cost BarChart */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 14px', marginBottom: 24 }}>
        <SectionTitle label="平均 LLM 成本 (USD/用户)" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={costChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
            <YAxis
              tickFormatter={(v: number) => `$${v.toFixed(4)}`}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip
              contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
              formatter={(value, _name, props) => [
                `$${String(value)} (n=${(props.payload as { sampleSize: number }).sampleSize.toLocaleString()})`,
                '平均成本',
              ]}
            />
            <Bar dataKey="avgCost" name="平均成本 (USD)" radius={[3, 3, 0, 0]}
              label={{ position: 'top', fontSize: 9, fill: 'var(--text-muted)' }}>
              {costChartData.map((entry, idx) => (
                <Cell key={idx} fill={VARIANT_COLORS[entry.variant] ?? '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <SignificanceConclusion metric="cost" variants={variants as Parameters<typeof SignificanceConclusion>[0]['variants']} significanceResults={sigResults} />
      </div>

      {/* Experiment Timeline AreaChart */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '16px 14px', marginBottom: 24 }}>
        <SectionTitle label="实验时间线 (累积 Sample Size)" />
        <ExperimentTimeline timeline={timeline} />
      </div>

      {/* Action panel */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 14px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6 }}>
        <SectionTitle label="操作" />
        <div style={{ width: '100%', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Promote winner — dual approval */}
          {detail.status === 'running' && (
            <button
              onClick={() => setShowPromote(true)}
              style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e55', borderRadius: 5, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              🏆 升 Winner 到 100%
            </button>
          )}

          {/* Stop loss — super_admin only */}
          {currentRole === 'super_admin' && detail.status === 'running' && (
            <button
              onClick={() => setShowStop(true)}
              style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444455', borderRadius: 5, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              ⚡ 一键停损
            </button>
          )}

          {/* PDF export */}
          <PDFDownloadLink
            document={<ExperimentReportPdf data={pdfData} />}
            fileName={pdfFileName}
          >
            {({ loading }) => (
              <button
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 16px', fontSize: 13, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? '生成 PDF…' : '📄 导出 PDF'}
              </button>
            )}
          </PDFDownloadLink>

          {/* Refresh */}
          <button
            onClick={refetchAll}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* Promote modal */}
      {showPromote && (
        <PromoteWinnerModal
          experimentId={detail.id}
          experimentKey={detail.experimentKey}
          onClose={() => setShowPromote(false)}
          onSubmitted={refetchAll}
        />
      )}

      {/* Stop modal */}
      {showStop && (
        <StopConfirmModal
          experimentId={detail.id}
          experimentKey={detail.experimentKey}
          onClose={() => setShowStop(false)}
          onStopped={() => { refetchAll(); }}
        />
      )}
    </div>
  );
}
