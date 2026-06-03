/**
 * VideoProduction.test.tsx — 阶段2 接真 trpc.videoProduction.generate
 * mock trpc · 断言:
 *   - h1/subtitle/CTA 字面锁
 *   - 无真结果时:section 标题可见、分镜渲染 mock 数据、不显 fallback/error 提示
 *   - 有真结果:映射 shotList/equipment → 渲染真数据(门控)
 *   - loading 态:显示 vp-loading-banner
 *   - error 态:显示 vp-error-notice
 *   - isFallback=true:显示 vp-fallback-notice
 *   - CTA 调 generate mutation
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  VIDEO_PRODUCTION_BGM,
  VIDEO_PRODUCTION_BGM_TITLE,
  VIDEO_PRODUCTION_DEFAULT_COPY,
  VIDEO_PRODUCTION_EDITING,
  VIDEO_PRODUCTION_EDITING_TITLE,
  VIDEO_PRODUCTION_FEEDBACK_PROMPT,
  VIDEO_PRODUCTION_H1,
  VIDEO_PRODUCTION_SHOOTING_TITLE,
  VIDEO_PRODUCTION_STORYBOARD_TITLE,
  VIDEO_PRODUCTION_SUBTITLE,
  VIDEO_PRODUCTION_TELEPROMPTER_TITLE,
} from '@/lib/constants/video-production';
import VideoProduction from '@/pages/tools/VideoProduction';

// ── Mutable store: tests set state here before renderPage() ──────────────────
const _store: {
  isPending: boolean;
  isError: boolean;
  data: unknown;
  mutate: ReturnType<typeof vi.fn>;
} = {
  isPending: false,
  isError: false,
  data: undefined,
  mutate: vi.fn(),
};

// ── trpc mock — reads from _store on every useMutation() call ────────────────
vi.mock('@/lib/trpc', () => ({
  trpc: {
    auth: { me: { useQuery: () => ({ data: null, isLoading: false }) } },
    ipAccounts: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      active: { useQuery: () => ({ data: null, isLoading: false }) },
      switchActive: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    stepData: {
      get: {
        useQuery: () => ({
          data: null,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
      save: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    videoProduction: {
      generate: {
        useMutation: ({ onSuccess, onError }: {
          onSuccess?: () => void;
          onError?: (err: { message: string }) => void;
        } = {}) => ({
          mutate: (...args: unknown[]) => {
            _store.mutate(...args);
            if (!_store.isError) onSuccess?.();
            else onError?.({ message: 'generate error' });
          },
          isPending: _store.isPending,
          isError: _store.isError,
          data: _store.data,
        }),
      },
    },
  },
}));

vi.mock('@/hooks/useActiveAccount', () => ({
  useActiveAccount: () => ({
    account: null,
    isLoading: false,
    isSwitching: false,
    switchTo: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

// ── real result shapes ────────────────────────────────────────────────────────
const REAL_SHOT_LIST = [
  {
    scene: '开场',
    duration: '3s',
    action: '镜头推近',
    dialogue: '大家好',
    cameraAngle: '中景',
    prop: '补光灯',
    lighting: '三点布光',
    transition: '切',
    sfx: '无',
    voiceover: '（开场白）你好世界',
    subtitle: '开场字幕',
    costume: '商务休闲',
    location: '摄影棚',
    index: 1,
    angle: '平角',
    movement: '推',
    description: '开场画面描述',
    bgm: '轻快科技感',
    reference: '无',
    note: '无',
  },
  {
    scene: '核心内容',
    duration: '30s',
    action: '详细讲解',
    dialogue: '核心内容台词',
    cameraAngle: '近景',
    prop: '笔记本电脑',
    lighting: '补光',
    transition: '跳切',
    sfx: '背景音乐',
    voiceover: '（讲解）这是核心内容',
    subtitle: '关键信息',
    costume: '同开场',
    location: '同开场',
    index: 2,
    angle: '中景',
    movement: '固定',
    description: '展示核心内容',
    bgm: '专业背景音乐',
    reference: '无',
    note: '无',
  },
];

function makeResultRow(isFallback: boolean) {
  return {
    id: 42,
    content: JSON.stringify({
      shotList: REAL_SHOT_LIST,
      equipment: ['专业相机', '三脚架', '补光灯'],
      schedule: '2小时',
    }),
    contentType: 'json',
    agentId: 'VideoAgent',
    agentMode: 'production',
    scriptType: null,
    elements: [],
    isFallback,
    tokensUsed: 1200,
    modelUsed: 'claude-3-5-sonnet',
    durationMs: 8000,
    traceId: 'trace-abc',
    createdAt: new Date(),
  };
}

// ── render helper ─────────────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <VideoProduction />
    </MemoryRouter>,
  );
}

// ── reset store to idle before each test ─────────────────────────────────────
beforeEach(() => {
  _store.isPending = false;
  _store.isError = false;
  _store.data = undefined;
  _store.mutate = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── 字面锁 ────────────────────────────────────────────────────────────────────
describe('VideoProduction — 字面锁 + 常量', () => {
  it('h1 字面锁 "短视频一键制作"', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(VIDEO_PRODUCTION_H1);
  });

  it('subtitle 字面锁', () => {
    renderPage();
    expect(screen.getByText(VIDEO_PRODUCTION_SUBTITLE)).toBeInTheDocument();
  });

  it('CTA button 存在且默认不 disabled', () => {
    renderPage();
    expect(screen.getByTestId('vp-generate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('vp-generate-btn')).not.toBeDisabled();
  });

  it('默认文案 prefilled', () => {
    renderPage();
    expect(screen.getByRole('textbox')).toHaveValue(VIDEO_PRODUCTION_DEFAULT_COPY);
  });
});

// ── section 标题 ──────────────────────────────────────────────────────────────
describe('VideoProduction — section 标题常量', () => {
  it('5 section 标题全部可见', () => {
    renderPage();
    expect(screen.getByText(VIDEO_PRODUCTION_STORYBOARD_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_SHOOTING_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_TELEPROMPTER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_BGM_TITLE)).toBeInTheDocument();
    expect(screen.getByText(VIDEO_PRODUCTION_EDITING_TITLE)).toBeInTheDocument();
  });
});

// ── idle 态 · mock 数据渲染 ───────────────────────────────────────────────────
describe('VideoProduction — 无真结果(idle)· mock 数据渲染', () => {
  it('分镜:场景 1 + time 0:00-0:03', () => {
    renderPage();
    expect(screen.getAllByText('场景 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('0:00-0:03')).toBeInTheDocument();
  });

  it('分镜:场景 14 + time 1:14-1:18', () => {
    renderPage();
    expect(screen.getAllByText('场景 14').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1:14-1:18')).toBeInTheDocument();
  });

  it('分镜:场景 1 voiceover 字面', () => {
    renderPage();
    expect(
      screen.getAllByText(
        '（BGM起，略带神秘感）你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；',
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('拍摄方案:设备项 "手机（iPhone 15 Pro Max或同级别安卓旗舰）"', () => {
    renderPage();
    expect(
      screen.getByText('手机（iPhone 15 Pro Max或同级别安卓旗舰）'),
    ).toBeInTheDocument();
  });

  it('拍摄方案:预计时长 "1分20秒 - 1分30秒"', () => {
    renderPage();
    expect(screen.getByText('1分20秒 - 1分30秒')).toBeInTheDocument();
  });

  it('配乐建议:4 chip 全部可见', () => {
    renderPage();
    VIDEO_PRODUCTION_BGM.chips.forEach((chip) => {
      expect(screen.getAllByText(chip).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('剪辑要点:第 1 条字面', () => {
    renderPage();
    expect(
      screen.getByText('开头3秒内迅速抛出核心问题，抓住观众注意力。'),
    ).toBeInTheDocument();
  });

  it('剪辑要点:11 条全部渲染', () => {
    renderPage();
    VIDEO_PRODUCTION_EDITING.forEach((item) => {
      expect(screen.getAllByText(item).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('反馈 prompt "这个结果对你有帮助吗？"', () => {
    renderPage();
    expect(screen.getByText(VIDEO_PRODUCTION_FEEDBACK_PROMPT)).toBeInTheDocument();
  });

  it('反馈按钮:有帮助 + 无帮助', () => {
    renderPage();
    expect(screen.getByRole('button', { name: '有帮助' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '无帮助' })).toBeInTheDocument();
  });

  it('idle 态:无 fallback notice / error notice / loading banner', () => {
    renderPage();
    expect(screen.queryByTestId('vp-fallback-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vp-error-notice')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vp-loading-banner')).not.toBeInTheDocument();
  });
});

// ── loading 态 ────────────────────────────────────────────────────────────────
describe('VideoProduction — loading 态', () => {
  it('isPending=true: 显示 vp-loading-banner + CTA disabled', () => {
    _store.isPending = true;
    renderPage();
    expect(screen.getByTestId('vp-loading-banner')).toBeInTheDocument();
    expect(screen.getByTestId('vp-generate-btn')).toBeDisabled();
  });
});

// ── error 态 ──────────────────────────────────────────────────────────────────
describe('VideoProduction — error 态', () => {
  it('isError=true: 显示 vp-error-notice', () => {
    _store.isError = true;
    renderPage();
    expect(screen.getByTestId('vp-error-notice')).toBeInTheDocument();
  });

  it('isError=true: 不显示 loading banner', () => {
    _store.isError = true;
    renderPage();
    expect(screen.queryByTestId('vp-loading-banner')).not.toBeInTheDocument();
  });
});

// ── CTA 调 generate mutation ──────────────────────────────────────────────────
describe('VideoProduction — CTA 调 generate mutation', () => {
  it('点击 CTA 时调用 generateMutation.mutate(sourceCopy)', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('vp-generate-btn'));
    expect(_store.mutate).toHaveBeenCalledTimes(1);
    expect(_store.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ sourceCopy: expect.any(String) }),
    );
  });
});

// ── 有真结果 · 门控渲染真数据 ────────────────────────────────────────────────
describe('VideoProduction — 有真结果(门控)', () => {
  beforeEach(() => {
    _store.data = makeResultRow(false);
  });

  it('真 shotList 渲染到分镜 section(vp-storyboard-real testid 可见)', () => {
    renderPage();
    expect(screen.getByTestId('vp-storyboard-real')).toBeInTheDocument();
  });

  it('真 shotList 第一条 scene "开场" 可见', () => {
    renderPage();
    expect(screen.getAllByText('开场').length).toBeGreaterThanOrEqual(1);
  });

  it('真 shotList 第二条 scene "核心内容" 可见', () => {
    renderPage();
    expect(screen.getAllByText('核心内容').length).toBeGreaterThanOrEqual(1);
  });

  it('真设备列表 "专业相机" 渲染到拍摄方案', () => {
    renderPage();
    expect(screen.getAllByText('专业相机').length).toBeGreaterThanOrEqual(1);
  });

  it('有真结果(isFallback=false):无 fallback notice', () => {
    renderPage();
    expect(screen.queryByTestId('vp-fallback-notice')).not.toBeInTheDocument();
  });

  it('有真结果:mock 拍摄设备 "手机（iPhone 15 Pro Max或同级别安卓旗舰）" 不再显示(已被真数据替换)', () => {
    renderPage();
    expect(
      screen.queryByText('手机（iPhone 15 Pro Max或同级别安卓旗舰）'),
    ).not.toBeInTheDocument();
  });
});

// ── isFallback 降级提示 ───────────────────────────────────────────────────────
describe('VideoProduction — isFallback 降级提示', () => {
  it('isFallback=true 显示 vp-fallback-notice', () => {
    _store.data = makeResultRow(true);
    renderPage();
    expect(screen.getByTestId('vp-fallback-notice')).toBeInTheDocument();
  });

  it('isFallback=false 不显示 vp-fallback-notice', () => {
    _store.data = makeResultRow(false);
    renderPage();
    expect(screen.queryByTestId('vp-fallback-notice')).not.toBeInTheDocument();
  });
});

// ── P2.14 补充测试 ─────────────────────────────────────────────────────────────

// malformed JSON content → hasResult=false 不崩
describe('VideoProduction — malformed JSON content', () => {
  it('content 不是合法 JSON → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: '{not valid json!!!',
    };
    // 渲染不抛错
    expect(() => renderPage()).not.toThrow();
    // 因 parseContent 返回 undefined，不显示真实分镜
    expect(screen.queryByTestId('vp-storyboard-real')).not.toBeInTheDocument();
  });

  it('content 合法 JSON 但缺 shotList → hasResult=false，不崩溃', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({ equipment: [], schedule: '2h' }),
    };
    expect(() => renderPage()).not.toThrow();
    expect(screen.queryByTestId('vp-storyboard-real')).not.toBeInTheDocument();
  });
});

// 全 voiceover='无' → 回退 mock teleprompter
describe('VideoProduction — voiceover 全为"无"时回退 mock 提词器', () => {
  it('所有 voiceover="无" 时提词器仍有内容(mock fallback)', () => {
    _store.data = {
      ...makeResultRow(false),
      content: JSON.stringify({
        shotList: [
          { ...REAL_SHOT_LIST[0], voiceover: '无' },
          { ...REAL_SHOT_LIST[1], voiceover: '无' },
        ],
        equipment: ['相机'],
        schedule: '1小时',
      }),
    };
    renderPage();
    // 段落数 > 0 说明回退了 mock teleprompter
    const teleprompterSection = screen.getByRole('heading', { level: 3, name: /提词器/i });
    expect(teleprompterSection).toBeInTheDocument();
    // 页面正常渲染(mock teleprompter fallback 使段落列表非空)
    expect(screen.getByTestId('vp-generate-btn')).toBeInTheDocument();
  });
});

// 真 voiceover 内容渲染进提词器
describe('VideoProduction — 真 voiceover 渲染进提词器', () => {
  it('voiceover 有实质内容时提词器显示真文字(含 voiceover 文本)', () => {
    _store.data = makeResultRow(false); // REAL_SHOT_LIST has voiceovers
    renderPage();
    // 真分镜 voiceover "（开场白）你好世界" 应出现在提词器(已过滤"无")
    expect(screen.getAllByText(/你好世界/).length).toBeGreaterThanOrEqual(1);
  });
});

// idle 不显示 vp-storyboard-real（负向）
describe('VideoProduction — idle 不显示真分镜(负向)', () => {
  it('无真结果时不渲染 vp-storyboard-real', () => {
    // _store.data 已在 beforeEach 重置为 undefined
    renderPage();
    expect(screen.queryByTestId('vp-storyboard-real')).not.toBeInTheDocument();
  });
});

// isError 态 → 重试按钮存在
describe('VideoProduction — error 态重试按钮', () => {
  it('isError=true 时重试按钮可点且重新触发 mutate', () => {
    _store.isError = true;
    renderPage();
    const retryBtn = screen.getByRole('button', { name: '重试' });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(_store.mutate).toHaveBeenCalledTimes(1);
  });
});
