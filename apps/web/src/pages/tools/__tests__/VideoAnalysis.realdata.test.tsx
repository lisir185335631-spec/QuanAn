/**
 * VideoAnalysis.realdata.test.tsx — 真实 agent 数据路径测试
 * Injection: trpc.videoAnalysis.analyze.useMutation 直接返回 data: { content: JSON.stringify(REAL_VIRAL_DATA) }
 *            组件读 analyzeMutation.data → parseVideoContent(data) → viralData → displayXxx
 * 断言:
 *   - displayHookAnalysis.evaluation (hookAnalysis.evaluation text)
 *   - displayTopicStrategy.evaluation (topicStrategy.evaluation text)
 *   - displayPopularElements[0].name → el.name rendered in DOM
 *   - displayNarrativeLabel (analysis.structure text)
 *   - displayNarrativeEvaluation (analysis.evaluation text) — Bug B fix验证
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import VideoAnalysis from '@/pages/tools/VideoAnalysis';

// ── sonner mock ──────────────────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// ── auth / account hooks ─────────────────────────────────────────────────────
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn(), refetch: vi.fn() }),
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({ account: null, isLoading: false, isSwitching: false, switchTo: vi.fn() }),
}));

// ── Real viral data — all fields distinct from generateMockResult() defaults ──
// parseVideoContent requires: analysis (object), insights (array), rewriteVersion (string)
const REAL_VIRAL_DATA = {
  analysis: {
    elements: ['resonance', 'curiosity'],
    structure: '真实叙事结构·问题解决型',
    hookType: '真实钩子类型·数据冲击型',
    viralFormula: '真实爆款公式·数据+情绪+行动',
    evaluation: '真实叙事节奏评估：内容起伏自然、高潮张力强、结尾引导有力',
  },
  insights: [
    {
      element: '真实洞察元素一·数据冲击',
      explanation: '用具体数字引发认知冲突，触发分享欲',
      impact: '高',
    },
    {
      element: '真实洞察元素二·情绪共鸣',
      explanation: '贴近目标用户的真实生活困境，产生强烈共鸣',
      impact: '高',
    },
    {
      element: '真实洞察元素三·稀缺信号',
      explanation: '暗示信息不对称，激发用户求知欲',
      impact: '中',
    },
  ],
  rewriteVersion: '真实仿写版本：数据驱动的爆款开头，让你的视频播放量翻倍的三个关键密码。',
  hookAnalysis: {
    score: 87,
    maxScore: 100,
    type: '真实钩子类型·数据震撼型',
    technique: '开篇用反常识数据打破认知，制造强烈的心理冲突',
    evaluation: '真实钩子评估：极强吸引力，预计完播率提升40%以上',
  },
  topicStrategy: {
    category: '真实选题类别·AI创业赛道',
    angle: '真实选题角度·从打工到创业的跃迁路径',
    targetAudience: '真实目标受众·25-40岁有创业意愿的职场人',
    evaluation: '真实选题评估：精准垂直赛道，变现潜力极高',
  },
  timeline: [
    '真实时间轴步骤1·建立认知',
    '真实时间轴步骤2·激发欲望',
    '真实时间轴步骤3·促成行动',
  ],
};

// ── trpc mock — analyzeMutation.data pre-set with real viral content ──────────
// Component reads: analyzeMutation.data → parseVideoContent(data) → viralData
// viralData drives all displayXxx computed values on first render.
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    videoAnalysis: {
      analyze: {
        useMutation: (_opts?: { onSuccess?: () => void; onError?: (e: { message?: string }) => void }) => ({
          mutate: vi.fn(),
          isPending: false,
          isError: false,
          data: { content: JSON.stringify(REAL_VIRAL_DATA) },
        }),
      },
    },
  },
}));

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <VideoAnalysis />
    </MemoryRouter>,
  );
}

// ── 真实 agent 数据路径测试 ────────────────────────────────────────────────────
describe('VideoAnalysis — 真实 agent 数据路径', () => {
  it('真实 hookAnalysis.evaluation 渲染到 DOM', () => {
    renderPage();
    // displayHookAnalysis = viralData?.hookAnalysis ?? generated.hookAnalysis
    // rendered at line ~1128: {displayHookAnalysis.evaluation}
    expect(screen.getByText('真实钩子评估：极强吸引力，预计完播率提升40%以上')).toBeInTheDocument();
  });

  it('真实 topicStrategy.evaluation 渲染到 DOM', () => {
    renderPage();
    // displayTopicStrategy = viralData?.topicStrategy ?? generated.topicStrategy
    // rendered at line ~1057: {displayTopicStrategy.evaluation}
    expect(screen.getByText('真实选题评估：精准垂直赛道，变现潜力极高')).toBeInTheDocument();
  });

  it('真实 insights[0].element 名称渲染到 DOM', () => {
    renderPage();
    // displayPopularElements[0].name = viralData.insights[0].element
    // rendered at line ~1261: {el.name}
    expect(screen.getByText('真实洞察元素一·数据冲击')).toBeInTheDocument();
  });

  it('真实 analysis.structure 叙事结构标签渲染到 DOM', () => {
    renderPage();
    // displayNarrativeLabel = viralData?.analysis.structure ?? generated.narrativeStructure.label
    // rendered at line ~925 and ~1172
    expect(screen.getAllByText('真实叙事结构·问题解决型').length).toBeGreaterThanOrEqual(1);
  });

  it('真实 hookAnalysis.score 87 渲染到雷达/评分区', () => {
    renderPage();
    // displayHookAnalysis.score = 87; rendered in score widget and RADAR_DIMS_VA
    // line ~808: {displayHookAnalysis.score} and ~1088
    expect(screen.getAllByText('87').length).toBeGreaterThanOrEqual(1);
  });

  it('真实 analysis.evaluation 叙事节奏评估渲染到 DOM (Bug B fix验证)', () => {
    renderPage();
    // displayNarrativeEvaluation = viralData?.analysis?.evaluation ?? generated.narrativeStructure.evaluation
    // When viralData.analysis.evaluation is set, the real value replaces the mock fallback
    // rendered at "节奏评估" section: {displayNarrativeEvaluation}
    expect(screen.getByText('真实叙事节奏评估：内容起伏自然、高潮张力强、结尾引导有力')).toBeInTheDocument();
  });
});
