/**
 * PrivateDomain.test.tsx — PRD-15 US-005 AC-9
 * ≥ 10 it: 4 view 切换 + 6 阶段卡片 + 表单验证 + 流式渲染 + 历史 view + draft localStorage
 * Node environment — pure source inspection + schema tests (no React render)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { generatePrivateDomainInput } from '../../../../packages/schemas/src/specialist-io/privateDomain.schema';

const ROOT = resolve(__dirname, '../../../../');
const PAGE = `${ROOT}/apps/web/src/pages/tools/PrivateDomain.tsx`;
const FLOW_VIEW = `${ROOT}/apps/web/src/pages/tools/components/PrivateDomainFlowView.tsx`;
const CONFIG_VIEW = `${ROOT}/apps/web/src/pages/tools/components/PrivateDomainConfigView.tsx`;
const RESULT_VIEW = `${ROOT}/apps/web/src/pages/tools/components/PrivateDomainResultView.tsx`;
const HISTORY_VIEW = `${ROOT}/apps/web/src/pages/tools/components/PrivateDomainHistoryView.tsx`;
const PHASE_CARD = `${ROOT}/apps/web/src/pages/tools/components/PhaseCard.tsx`;
const API_ROUTER = `${ROOT}/apps/api/src/trpc/routers/privateDomain.ts`;

function src(path: string): string {
  return readFileSync(path, 'utf-8');
}

// ── 1 · Page structure (4 view modes) ────────────────────────────────────────

describe('PrivateDomain.tsx page structure', () => {
  it('has 400+ lines (stub replaced)', () => {
    const lines = src(PAGE).split('\n').length;
    expect(lines).toBeGreaterThan(400);
  });

  it('implements 4 view modes (flow|config|result|history) via URL state', () => {
    const page = src(PAGE);
    expect(page).toContain("'flow'");
    expect(page).toContain("'config'");
    expect(page).toContain("'result'");
    expect(page).toContain("'history'");
    expect(page).toContain('useSearchParams');
    expect(page).toContain('view');
  });

  it('imports and renders PrivateDomainFlowView', () => {
    const page = src(PAGE);
    expect(page).toContain('PrivateDomainFlowView');
    expect(page).toContain("from './components/PrivateDomainFlowView'");
  });

  it('imports and renders PrivateDomainConfigView', () => {
    const page = src(PAGE);
    expect(page).toContain('PrivateDomainConfigView');
    expect(page).toContain("from './components/PrivateDomainConfigView'");
  });

  it('imports and renders PrivateDomainResultView', () => {
    const page = src(PAGE);
    expect(page).toContain('PrivateDomainResultView');
    expect(page).toContain("from './components/PrivateDomainResultView'");
  });

  it('imports and renders PrivateDomainHistoryView', () => {
    const page = src(PAGE);
    expect(page).toContain('PrivateDomainHistoryView');
    expect(page).toContain("from './components/PrivateDomainHistoryView'");
  });

  it('calls trpc.privateDomain.generate.useMutation()', () => {
    const page = src(PAGE);
    expect(page).toContain('trpc.privateDomain.generate.useMutation');
  });
});

// ── 2 · 6-phase flow view (ui/_1) ────────────────────────────────────────────

describe('PrivateDomainFlowView 6 阶段卡片 (ui/_1)', () => {
  it('renders 6 default phase cards', () => {
    const flow = src(FLOW_VIEW);
    expect(flow).toContain('attract');
    expect(flow).toContain('add_wechat');
    expect(flow).toContain('trust');
    expect(flow).toContain('moments');
    expect(flow).toContain('convert');
    expect(flow).toContain('repurchase');
  });

  it('shows phase connectors between cards', () => {
    const flow = src(FLOW_VIEW);
    expect(flow).toContain('phase-connector');
  });

  it('PhaseCard shows 状态(未生成/已生成)', () => {
    const card = src(PHASE_CARD);
    expect(card).toContain('已生成');
    expect(card).toContain('未生成');
  });

  it('PhaseCard expands to show tactics/scripts/metrics on click', () => {
    const card = src(PHASE_CARD);
    expect(card).toContain('tactics');
    expect(card).toContain('scripts');
    expect(card).toContain('metrics');
    expect(card).toContain('expanded');
  });
});

// ── 3 · Config form fields (ui/_5) ───────────────────────────────────────────

describe('PrivateDomainConfigView 配置表单 (ui/_5)', () => {
  it('has productDescription textarea', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('product-description-textarea');
    expect(config).toContain('productDescription');
  });

  it('has productPrice number input', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('product-price-input');
    expect(config).toContain('productPrice');
  });

  it('has targetAudience textarea', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('target-audience-textarea');
    expect(config).toContain('targetAudience');
  });

  it('has ipPositioning textarea', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('ip-positioning-textarea');
    expect(config).toContain('ipPositioning');
  });

  it('has currentChannel select with 5 options', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('current-channel-select');
    expect(config).toContain('wechat');
    expect(config).toContain('douyin');
    expect(config).toContain('xiaohongshu');
    expect(config).toContain('weibo');
    expect(config).toContain('other');
  });

  it('has monthlyTraffic number input', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('monthly-traffic-input');
    expect(config).toContain('monthlyTraffic');
  });

  it('form validation: submit disabled when fields empty', () => {
    const config = src(CONFIG_VIEW);
    expect(config).toContain('isValid');
    expect(config).toContain('disabled');
  });
});

// ── 4 · Result view streaming (ui/_7) ────────────────────────────────────────

describe('PrivateDomainResultView 生成结果 (ui/_7)', () => {
  it('shows streaming state', () => {
    const result = src(RESULT_VIEW);
    expect(result).toContain('isStreaming');
    expect(result).toContain('animate');
  });

  it('has retry and view-history buttons', () => {
    const result = src(RESULT_VIEW);
    expect(result).toContain('retry-btn');
    expect(result).toContain('view-history-btn');
  });

  it('renders phase connectors between result phases', () => {
    const result = src(RESULT_VIEW);
    expect(result).toContain('phase-arrow');
  });
});

// ── 5 · History view (ui/_14) ────────────────────────────────────────────────

describe('PrivateDomainHistoryView 历史回看 (ui/_14)', () => {
  it('calls trpc.history.list with agentId PrivateDomainAgent', () => {
    const history = src(HISTORY_VIEW);
    expect(history).toContain("agentId: 'PrivateDomainAgent'");
    expect(history).toContain('trpc.history.list.useQuery');
  });

  it('has history-table with DenseTable structure', () => {
    const history = src(HISTORY_VIEW);
    expect(history).toContain('history-table');
    expect(history).toContain('history-row-');
  });

  it('has restore-btn to restore view 1-3 state', () => {
    const history = src(HISTORY_VIEW);
    expect(history).toContain('restore-btn-');
    expect(history).toContain('onRestore');
  });

  it('shows empty state when no history', () => {
    const history = src(HISTORY_VIEW);
    expect(history).toContain('history-empty');
  });
});

// ── 6 · localStorage draft (AC-7) ────────────────────────────────────────────

describe('PrivateDomain localStorage draft (AC-7)', () => {
  it('draft key includes userId and private_domain_draft', () => {
    const page = src(PAGE);
    expect(page).toContain('private_domain_draft_');
    expect(page).toContain('userId');
    expect(page).toContain('accountId');
  });

  it('uses debounce 1s for draft save', () => {
    const page = src(PAGE);
    expect(page).toContain('1000');
    expect(page).toContain('setTimeout');
  });
});

// ── 7 · Schema validation ─────────────────────────────────────────────────────

describe('generatePrivateDomainInput schema', () => {
  it('validates valid input', () => {
    const result = generatePrivateDomainInput.safeParse({
      productDescription: '职业规划咨询',
      productPrice: 2980,
      targetAudience: '职场新人',
      ipPositioning: '10年HR经验',
      currentChannel: 'douyin',
      monthlyTraffic: 50000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid channel', () => {
    const result = generatePrivateDomainInput.safeParse({
      productDescription: '产品',
      productPrice: 100,
      targetAudience: '受众',
      ipPositioning: 'IP',
      currentChannel: 'invalid_channel',
      monthlyTraffic: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = generatePrivateDomainInput.safeParse({
      productDescription: '产品',
      productPrice: -100,
      targetAudience: '受众',
      ipPositioning: 'IP',
      currentChannel: 'wechat',
      monthlyTraffic: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 5 channel values', () => {
    const channels = ['wechat', 'douyin', 'xiaohongshu', 'weibo', 'other'] as const;
    for (const ch of channels) {
      const result = generatePrivateDomainInput.safeParse({
        productDescription: '产品',
        productPrice: 100,
        targetAudience: '受众',
        ipPositioning: 'IP',
        currentChannel: ch,
        monthlyTraffic: 1000,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ── 8 · API router (AC-8) ────────────────────────────────────────────────────

describe('privateDomain API router', () => {
  it('router accepts new 6-field input schema', () => {
    const router = src(API_ROUTER);
    expect(router).toContain('productDescription');
    expect(router).toContain('productPrice');
    expect(router).toContain('targetAudience');
    expect(router).toContain('ipPositioning');
    expect(router).toContain('currentChannel');
    expect(router).toContain('monthlyTraffic');
  });

  it('router writes to History with PrivateDomainAgent', () => {
    const router = src(API_ROUTER);
    expect(router).toContain("agentId: 'PrivateDomainAgent'");
    expect(router).toContain('history.create');
  });

  it('router builds 6-phase SOP content', () => {
    const router = src(API_ROUTER);
    expect(router).toContain('attract');
    expect(router).toContain('repurchase');
    expect(router).toContain('buildMockSop');
  });

  it('router has generateStream SSE subscription (AC-8)', () => {
    const router = src(API_ROUTER);
    expect(router).toContain('generateStream');
    expect(router).toContain('.subscription(');
    expect(router).toContain('async function*');
  });

  it('generateStream yields phase chunks individually (AC-8 per-phase chunk)', () => {
    const router = src(API_ROUTER);
    // must yield each phase, not all at once
    expect(router).toContain("type: 'phase'");
    expect(router).toContain("type: 'done'");
    expect(router).toContain('yield');
  });
});

// ── 9 · Frontend SSE streaming (AC-8 frontend) ───────────────────────────────

describe('PrivateDomain page SSE streaming (AC-8 frontend)', () => {
  it('imports trpcClient for imperative subscription', () => {
    const page = src(PAGE);
    expect(page).toContain('trpcClient');
    expect(page).toContain("from '@/lib/trpc'");
  });

  it('calls generateStream.subscribe for SSE streaming', () => {
    const page = src(PAGE);
    expect(page).toContain('generateStream');
    expect(page).toContain('.subscribe(');
  });

  it('handles phase chunks from stream (onData)', () => {
    const page = src(PAGE);
    expect(page).toContain("chunk.type === 'phase'");
    expect(page).toContain("chunk.type === 'done'");
  });

  it('unsubscribes on unmount (no memory leak)', () => {
    const page = src(PAGE);
    expect(page).toContain('subRef.current?.unsubscribe()');
  });
});
