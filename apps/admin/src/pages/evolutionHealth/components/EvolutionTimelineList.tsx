// PRD-13 US-006 · EvolutionTimelineList — insights + anomaly flags merged timeline
// AC-6: styleAdjustments JSON 高亮 + 异常 flag tag

export interface TimelineInsight {
  id: number;
  triggerType: string;
  direction: string;
  levelBefore: string | null;
  levelAfter: string | null;
  isFallback: boolean;
  createdAt: Date | string;
}

export interface TimelineAnomalyFlag {
  id: number;
  anomalyType: string;
  severity: string;
  evidence: unknown;
  detectedAt: Date | string;
  resolvedAt: Date | string | null;
  resolution: string | null;
}

interface Props {
  insights: TimelineInsight[];
  anomalyFlags: TimelineAnomalyFlag[];
  isLoading?: boolean;
}

const ANOMALY_LABELS: Record<string, string> = {
  frequent_style_flip: '风格频繁翻转',
  avoidlist_overflow: '屏蔽词表溢出',
  negative_feedback_dominant: '负反馈主导',
  flywheel_stalled: '飞轮停滞',
  conflicting_insights: '洞察冲突',
};

function relativeTime(date: Date | string): string {
  const d = new Date(String(date));
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  return d.toLocaleDateString('zh-CN');
}

function severityColor(severity: string): string {
  if (severity === 'high') return '#ef4444';
  if (severity === 'medium') return '#f59e0b';
  return 'var(--text-muted)';
}

export function EvolutionTimelineList({ insights, anomalyFlags, isLoading }: Props) {
  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>加载中…</div>;
  }

  if (insights.length === 0 && anomalyFlags.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>暂无进化记录</div>;
  }

  type Item =
    | { kind: 'insight'; data: TimelineInsight; ts: number }
    | { kind: 'flag'; data: TimelineAnomalyFlag; ts: number };

  const items: Item[] = [
    ...insights.map((i) => ({ kind: 'insight' as const, data: i, ts: new Date(String(i.createdAt)).getTime() })),
    ...anomalyFlags.map((f) => ({
      kind: 'flag' as const,
      data: f,
      ts: new Date(String(f.detectedAt)).getTime(),
    })),
  ].sort((a, b) => b.ts - a.ts);

  return (
    <div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const dotColor =
          item.kind === 'insight'
            ? 'var(--accent-purple)'
            : severityColor(item.data.severity);

        return (
          <div
            key={`${item.kind}-${item.data.id}`}
            style={{
              display: 'flex',
              gap: 10,
              padding: '8px 0',
              borderBottom: isLast ? 'none' : '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
                marginTop: 5,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {item.kind === 'insight' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                      {item.data.triggerType}
                    </span>
                    {item.data.levelBefore &&
                      item.data.levelAfter &&
                      item.data.levelBefore !== item.data.levelAfter && (
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--gold)',
                            border: '1px solid var(--gold-dim)',
                            padding: '0 4px',
                            borderRadius: 3,
                          }}
                        >
                          {item.data.levelBefore} → {item.data.levelAfter}
                        </span>
                      )}
                    {item.data.isFallback && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-dim)',
                          border: '1px solid var(--border)',
                          padding: '0 4px',
                          borderRadius: 3,
                        }}
                      >
                        fallback
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    方向: {item.data.direction} · {relativeTime(item.data.createdAt)}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                      ⚠ {ANOMALY_LABELS[item.data.anomalyType] ?? item.data.anomalyType}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: severityColor(item.data.severity),
                        border: `1px solid ${severityColor(item.data.severity)}44`,
                        padding: '0 4px',
                        borderRadius: 3,
                        fontWeight: 600,
                      }}
                    >
                      {item.data.severity}
                    </span>
                    {item.data.resolvedAt && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#22c55e',
                          border: '1px solid #22c55e44',
                          padding: '0 4px',
                          borderRadius: 3,
                        }}
                      >
                        已解决
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {relativeTime(item.data.detectedAt)}
                    {item.data.resolution ? ` · ${item.data.resolution}` : ''}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
