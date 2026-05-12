// PRD-11 US-004 · NSM 仪表盘主页
// AC-1: 替换 PRD-10 placeholder · 完整 NSM dashboard
// AC-2: grid-cols-[1fr_320px] · 左侧主区 + 右侧告警栏
// AC-10: ErrorBoundary fallback · 不白屏

import { Component } from 'react';

import { adminTrpc } from '../../lib/admin-client';
import { NsmAlerts } from './NsmAlerts';
import { NsmDistributions } from './NsmDistributions';
import { NsmFunnel } from './NsmFunnel';
import { NsmOverviewCards } from './NsmOverviewCards';

interface ErrorBoundaryState {
  hasError: boolean;
}

class NsmErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--status-err)',
            borderRadius: 6,
            padding: 24,
            color: 'var(--status-err)',
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          数据加载失败 · 点击重试
          <br />
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 12,
              background: 'none',
              border: '1px solid var(--status-err)',
              color: 'var(--status-err)',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NsmDashboardInner() {
  const { data: me } = adminTrpc.auth.me.useQuery();

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: '0.02em',
          }}
        >
          📊 NSM 仪表盘
        </h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          产品健康度生死线 · 活跃 IP 账号 + 完成率 + 反馈率 + 升级率
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* left: overview + funnel + distributions */}
        <div>
          <NsmOverviewCards role={me?.role} />
          <NsmFunnel />
          <NsmDistributions />
        </div>

        {/* right: alerts */}
        <NsmAlerts />
      </div>
    </div>
  );
}

export default function NsmDashboard() {
  return (
    <NsmErrorBoundary>
      <NsmDashboardInner />
    </NsmErrorBoundary>
  );
}
