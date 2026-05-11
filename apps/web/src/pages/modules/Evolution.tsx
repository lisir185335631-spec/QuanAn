/**
 * PRD-8 US-005: /evolution 页面
 * 4 sections: Hero(level+满意率) · Insight卡片 · 趋势 Recharts · Module ranking table
 * AC-8: level=L1 + 0 insight → cold-start UI
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

// ── types ─────────────────────────────────────────────────────────────────────

type EvolutionInsightContent = {
  direction: string;
  insights: {
    preferredCatchphrases: string[];
    styleTone: string;
    avoidList: string[];
    strongPoints: string[];
    weakPoints: string[];
  };
};

// ── sub-components ────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-label-sm font-label text-primary uppercase tracking-wide">
      {level}
    </span>
  );
}

function SatisfactionBar({ rate }: { rate: number | null }) {
  const pct = rate !== null && rate !== undefined ? Math.round(rate * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-surface-variant overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-label-sm font-label text-on-surface-variant w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

function ColdStartInsight() {
  return (
    <Card>
      <CardContent className="pt-6 text-center py-10">
        <p className="text-body-md text-muted-foreground">
          暂无 insight · 等累计 5 条反馈后自动生成
        </p>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          对每次 AI 生成结果点击 👍 / 👎 来积累反馈
        </p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: EvolutionInsightContent }) {
  return (
    <Card>
      <CardHeader>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          当前偏好画像 · {insight.direction}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {insight.insights.preferredCatchphrases.length > 0 && (
          <div>
            <p className="text-label-sm font-label text-on-surface-variant mb-2">偏好风格</p>
            <div className="flex flex-wrap gap-2">
              {insight.insights.preferredCatchphrases.map((phrase, i) => (
                <span
                  key={i}
                  className="rounded-md bg-surface-variant px-2 py-1 text-body-sm text-on-surface"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}
        {insight.insights.styleTone && (
          <div>
            <p className="text-label-sm font-label text-on-surface-variant mb-1">风格基调</p>
            <p className="text-body-md text-on-surface">{insight.insights.styleTone}</p>
          </div>
        )}
        {insight.insights.avoidList.length > 0 && (
          <div>
            <p className="text-label-sm font-label text-on-surface-variant mb-2">避免使用</p>
            <div className="flex flex-wrap gap-2">
              {insight.insights.avoidList.map((item, i) => (
                <span
                  key={i}
                  className="rounded-md bg-destructive/10 px-2 py-1 text-body-sm text-destructive"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrendChart({ data }: { data: Array<{ date: string; total: number; good: number; satisfactionRate: number }> | undefined }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <span className="text-label-sm font-label text-primary uppercase tracking-wide">反馈趋势</span>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-body-sm text-muted-foreground">暂无趋势数据 · 开始使用后自动统计</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    total: d.total,
    good: d.good,
    rate: Math.round(d.satisfactionRate * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          反馈趋势 · 近 30 天
        </span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 16, left: -24, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#ccc' }}
            />
            <Line
              type="monotone"
              dataKey="good"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="👍"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#475569"
              strokeWidth={1.5}
              dot={false}
              name="总计"
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ModuleRankingTable({
  ranking,
}: {
  ranking:
    | Array<{
        agentId: string;
        goodCount: number;
        badCount: number;
        totalCalls: number;
        satisfactionRate: number;
      }>
    | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          模块满意率排名
        </span>
      </CardHeader>
      <CardContent>
        {!ranking || ranking.length === 0 ? (
          <p className="text-body-sm text-muted-foreground py-4 text-center">
            暂无数据 · 使用各模块后自动统计
          </p>
        ) : (
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left">
                <th className="pb-2 text-label-sm font-label text-on-surface-variant">模块</th>
                <th className="pb-2 text-label-sm font-label text-on-surface-variant text-right">
                  👍
                </th>
                <th className="pb-2 text-label-sm font-label text-on-surface-variant text-right">
                  👎
                </th>
                <th className="pb-2 text-label-sm font-label text-on-surface-variant text-right">
                  调用
                </th>
                <th className="pb-2 text-label-sm font-label text-on-surface-variant text-right">
                  满意率
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.agentId} className="border-b border-outline-variant/40 last:border-0">
                  <td className="py-2 text-on-surface font-medium">{row.agentId}</td>
                  <td className="py-2 text-right text-on-surface">{row.goodCount}</td>
                  <td className="py-2 text-right text-on-surface">{row.badCount}</td>
                  <td className="py-2 text-right text-muted-foreground">{row.totalCalls}</td>
                  <td className="py-2 text-right">
                    <span
                      className={
                        row.satisfactionRate >= 0.8
                          ? 'text-green-400'
                          : row.satisfactionRate >= 0.5
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {Math.round(row.satisfactionRate * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryList({
  insights,
}: {
  insights: Array<{
    id: number;
    triggerType: string;
    direction: string;
    content: unknown;
    levelBefore: string | null;
    levelAfter: string | null;
    createdAt: string | Date;
  }> | undefined;
}) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-label-sm font-label text-on-surface-variant uppercase tracking-wide">
        进化历史
      </p>
      {insights.map((insight) => (
        <Card key={insight.id}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-label-sm font-label text-primary">{insight.direction}</span>
              <span className="text-body-sm text-muted-foreground">
                {insight.levelBefore} → {insight.levelAfter}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant">{insight.triggerType}</p>
            <p className="text-body-xs text-muted-foreground mt-1">
              {new Date(insight.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Evolution() {
  const { data: profile, isLoading: profileLoading } = trpc.evolution.getProfile.useQuery();
  const { data: insightHistory, isLoading: historyLoading } =
    trpc.evolution.getInsightHistory.useQuery();
  const { data: trendData, isLoading: trendLoading } = trpc.evolution.getFeedbackTrend.useQuery({
    days: 30,
  });
  const { data: rankingData, isLoading: rankingLoading } =
    trpc.evolution.getModuleRanking.useQuery({ limit: 10 });

  const isLoading = profileLoading || historyLoading || trendLoading || rankingLoading;

  const isColdStart =
    !isLoading &&
    (!insightHistory || insightHistory.length === 0) &&
    (!profile || profile.level === 'L1');

  const latestInsight = profile?.latestInsight as EvolutionInsightContent | null;

  return (
    <main className="flex-1 container py-8 space-y-6 max-w-3xl">
      <h1 className="text-h1 font-display text-on-surface">进化中心</h1>

      {isLoading ? (
        <p className="text-body-md text-muted-foreground">加载中…</p>
      ) : (
        <>
          {/* Section 1: Hero — level + satisfaction rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <LevelBadge level={profile?.level ?? 'L1'} />
                <span className="text-body-md text-on-surface-variant">
                  总反馈 {profile?.feedbackCountTotal ?? 0} 条
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-label-sm font-label text-on-surface-variant">满意率</p>
                <SatisfactionBar rate={profile?.satisfactionRate ?? null} />
              </div>
              <div className="mt-4 flex gap-6 text-body-sm text-muted-foreground">
                <span>👍 {profile?.feedbackCountGood ?? 0}</span>
                <span>👎 {profile?.feedbackCountBad ?? 0}</span>
                <span>方向: {profile?.currentDirection ?? '综合'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Latest Insight (or cold-start) */}
          {isColdStart ? (
            <ColdStartInsight />
          ) : latestInsight ? (
            <InsightCard insight={latestInsight} />
          ) : null}

          {/* Section 3: Trend chart */}
          <TrendChart data={trendData} />

          {/* Section 4: Module ranking table */}
          <ModuleRankingTable ranking={rankingData?.ranking} />

          {/* Section 5: History list */}
          <HistoryList insights={insightHistory} />
        </>
      )}
    </main>
  );
}
