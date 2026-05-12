// PRD-11 US-004 · NSM Funnel · 6-stage horizontal funnel
// AC-4: Recharts <FunnelChart> · fill per data point · fill:'var(--accent-purple)'
// SHIELD: data points 必含 fill: var(--accent-purple)

import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';

import { adminTrpc } from '../../lib/admin-client';

const STAGES = ['IP账号总数', '完成步骤1', '完成步骤3', '完成步骤3b', '完成步骤7', '提交反馈'];

export function NsmFunnel() {
  const { data, isLoading, isError, refetch } = adminTrpc.nsm.getFunnel.useQuery(
    { granularity: 'day' },
    { staleTime: 60_000 },
  );

  if (isLoading) {
    return <SectionShell title="用户转化漏斗"><Skeleton /></SectionShell>;
  }

  if (isError) {
    return (
      <SectionShell title="用户转化漏斗">
        <ErrorMsg onRetry={() => void refetch()} />
      </SectionShell>
    );
  }

  const values: number[] = Array.isArray(data) && data.length === 6 ? data : Array(6).fill(0);

  const funnelData = STAGES.map((name, i) => ({
    name,
    value: values[i] ?? 0,
    fill: 'var(--accent-purple)',
  }));

  return (
    <SectionShell title="用户转化漏斗">
      <ResponsiveContainer width="100%" height={220}>
        <FunnelChart>
          <Tooltip
            contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12 }}
          />
          <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
            <LabelList position="right" fill="var(--text-muted)" stroke="none" dataKey="name" style={{ fontSize: 11 }} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </SectionShell>
  );
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Skeleton() {
  return <div style={{ height: 180, background: 'var(--bg-hover)', borderRadius: 4 }} />;
}

function ErrorMsg({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ color: 'var(--status-err)', fontSize: 13, padding: '16px 0' }}>
      数据加载失败 · <button type="button" onClick={onRetry} style={{ background: 'none', border: 'none', color: 'var(--gold-text)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}>点击重试</button>
    </div>
  );
}
