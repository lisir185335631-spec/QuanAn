import '@/styles/ikb-hero.css';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { IKBLayout } from '@/layouts/IKBLayout';
import {
  STEP3B_AUDIENCE,
  STEP3B_CTA_LABEL,
  STEP3B_LOADING_TEXT,
  STEP3B_SUBTITLE_TEMPLATE,
} from '@/lib/constants/step3b';
import { breakSentences } from '@/lib/text';
import { trpc } from '@/lib/trpc';

// ── 轻量运行时守卫 · 避免强转崩溃 ────────────────────────────────────────────
function isStep3bResult(x: unknown): x is Step3bResult {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof (r.coreIdentity as Record<string, unknown> | undefined)?.identityTag === 'string' &&
    Array.isArray(r.roadmap)
  );
}

// ── PRD-29.8 · Step3bResult schema ────────────────────────────────────────────
export interface Step3bResult {
  coreIdentity: {
    identityTag: string;
    quote: string;
    differentiation: string;
    memoryPoints: Array<{
      title: string;
      desc: string;
      practice: string;
    }>;
    traits: Array<{
      name: string;
      desc: string;
    }>;
  };
  thoughtSystem: {
    coreBeliefs: Array<{
      belief: string;
      reason: string;
      angle: string;
    }>;
    viewpoints: Array<{
      title: string;
      desc: string;
      exampleTitle: string;
    }>;
    mottos: Array<{
      motto: string;
      whenToUse: string;
      effect: string;
    }>;
  };
  contentPersona: {
    speakingStyle: string;
    speakingDos: string[];
    speakingDonts: string[];
    examplePitch: string;
    visualStyle: {
      style: string;
      outfit: string;
      scene: string;
      props: string[];
    };
    contentPillars: Array<{
      title: string;
      percentage: string;
      frequency: string;
      desc: string;
      cases: string[];
    }>;
  };
  trustSystem: {
    backings: Array<{
      claim: string;
      display: string;
    }>;
    socialProofs: Array<{
      proof: string;
      method: string;
    }>;
    storyLine: {
      mainStory: string;
      turningPoint: string;
      narrationMethod: string;
    };
  };
  roadmap: Array<{
    period: string;
    accent: 'green' | 'yellow' | 'purple';
    goal: string;
    steps: string[];
  }>;
}

// ── PRD-29.8 · Step3bFormData schema ──────────────────────────────────────────
export interface Step3bFormData {
  personalInfo: string;
  personalAdvantage: string;
  personalStory: string;
  platform: string;
  audience: string;
}

// ── PRD-29.8 · form 默认值 1:1 sally 真实输入 ────────────────────────────────
const DEFAULT_FORM: Step3bFormData = {
  personalInfo: '我是一名opc创业者，擅长与人沟通和项目交付。专业技能是给企业或者个人定制全自动工作流或者智能体，在这么行业从业半年。我以前是餐饮从业者，从事餐饮行业12年，作为品牌创始人之一的我，高峰时期拥有13家店铺（外卖店+实体店），因为品类周期原因，已经没有利润和持续的意义，加上因为认知问题投资的代加工厂失败，背上近百万的负债。后来果断一家一家店铺关掉，来到ai赛道做一家opc个人创业公司。我也是一名持续创业者，这是十几年期间有成功的项目也有失败血亏的项目，但是我从来不缺从头再来的勇气，目前公司已经交付一些简单的工作流和智能体平台，这些交付的案例都帮助客户解决了提效的问题，把客户从复杂重复的工作里抽身出来把精力放在更重要的商业决策上来。收费有4位数到6位数都有。我以前是技术小白，通过我不断的学习和自我迭代，到我现在可以交付项目。我自己的商业闭环走通这个环节也走了一些弯路，我把这些学习经验和沟通经验做成一系列的课程，想要帮助一些opc创业者避坑。',
  personalAdvantage: '我是一名持续创业者，这些年一直尝试餐饮的不同项目，有成功的类目也有失败的类目，总体来说有一些经验在身上的',
  personalStory: '2023年，第一次尝试用ai工具制作图片，非常感叹ai工具的厉害，中间也去各种科技展参观考察，思考并判断。这期间慢慢开始关闭自己的实体店。去年自己手工搓出来自己的第一条工作流，又一次感觉普通人也可以利用ai做自己喜欢做的事情，去年年底彻底关闭最后一家实体店铺全身心投入ai，今年龙虾机器人火之前，我就养出来多只龙虾协作办公了，现在给企业和个人定制智能体工作流，月入过万，刚接了个粉丝百万博主的商单，正在最后调优阶段',
  platform: 'douyin',
  audience: '需要定制智能体降本增效的老板和opc创业者',
};


export default function Step3b() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { dbQuery } = useStepData(accountId, 'step3b');

  // industry from step1 (default 美业)
  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  // PRD-29.8 · default form 1:1 复刻 sally 真实输入
  const [personalInfo, setPersonalInfo] = useState(breakSentences(DEFAULT_FORM.personalInfo));
  const [personalAdvantage, setPersonalAdvantage] = useState(
    breakSentences(DEFAULT_FORM.personalAdvantage),
  );
  const [personalStory, setPersonalStory] = useState(breakSentences(DEFAULT_FORM.personalStory));
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [audience, setAudience] = useState(DEFAULT_FORM.audience);

  // Restore form from LS on accountId change
  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step3bFormData>(accountId, 'step3b');
    if (saved?.personalInfo) {
      setPersonalInfo(saved.personalInfo);
      if (saved.personalAdvantage) setPersonalAdvantage(saved.personalAdvantage);
      if (saved.personalStory) setPersonalStory(saved.personalStory);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.audience) setAudience(saved.audience);
    }
  }, [accountId]);

  // PRD-29.8 · 真 mutation: trpc.stepData.save 接真后端 · 单写路径
  const generateMutation = trpc.stepData.save.useMutation({
    onSuccess: () => {
      void dbQuery.refetch();
      toast.success('生成完成');
    },
    onError: (err) => {
      toast.error(err.message || '生成失败，请重试');
    },
  });

  const isLoading = generateMutation.isPending;

  // PRD-29.8 · 真数据来源(带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined(不再 fallback mock)
  const mutationResult = (generateMutation.data as { ok?: boolean; data?: { result?: unknown; isFallback?: boolean } } | undefined);
  const rawSession = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: Step3bResult | undefined = isStep3bResult(rawSession) ? rawSession : undefined;
  const dbResult: Step3bResult | undefined = isStep3bResult(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: Step3bResult | undefined = sessionResult ?? dbResult;
  const hasRealResult = result !== undefined;
  const canBulkActions = hasRealResult && !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!personalInfo.trim() || isLoading) return;
    generateMutation.mutate({
      stepKey: 'step3b',
      inputs: { personalInfo, personalAdvantage, personalStory, platform, audience },
    });
  }

  function handleCopyAll() {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    void navigator.clipboard.writeText(text).then(() => toast.success('已复制全部'));
  }

  function handleExport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'persona-plan.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    toast.success('已智能优化');
  }

  const PLATFORMS = [
    { key: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
    { key: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
    { key: 'wechat', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
  ];

  // roadmap accent → IKB 三主色轮转
  const ACCENT: Record<string, string> = {
    green: C.ikb,
    yellow: C.accent3,
    purple: C.burgundy,
  };
  // 内容矩阵柱状图颜色轮转
  const BAR_COLORS = [C.ikb, C.burgundy, C.accent3, C.ikb];

  // 数据洞察雷达维度 — IKB 三主色轮转
  const RADAR_DIMS = [
    { label: '实战性', value: 92, color: C.ikb },
    { label: '韧性', value: 88, color: C.burgundy },
    { label: '真诚度', value: 90, color: C.accent3 },
    { label: '专业度', value: 84, color: C.ikb },
    { label: '记忆点', value: 86, color: C.burgundy },
    { label: '影响力', value: 78, color: C.accent3 },
  ];
  // 趋势图数据
  const TREND_DATA = [20, 32, 40, 55, 72, 100];
  const TREND_LABELS = ['第1月', '第2月', '第3月', '第4月', '第5月', '第6月'];

  return (
    <IKBLayout>
      <div className="pb-28">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-12 flex flex-row items-center justify-between gap-8">
          <div className="shrink-0">
            <div className="mb-3 flex items-center gap-3">
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  border: `1px solid ${C.line}`,
                  background: C.base,
                  color: C.ink,
                  padding: '4px 10px',
                }}
              >
                战略节点
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  border: `1px solid ${C.accent3}55`,
                  background: `${C.accent3}18`,
                  color: C.purpleText,
                  padding: '4px 10px',
                }}
              >
                核心引擎
              </span>
            </div>
            <h1
              style={{
                fontFamily: F.display,
                fontWeight: 400,
                fontSize: 40,
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                margin: 0,
                whiteSpace: 'nowrap',
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              STEP 03b · 深度人设分析
            </h1>
            <p
              className="mt-2 max-w-[820px]"
              style={{ fontSize: 16, color: '#5A6173', fontFamily: F.cn }}
            >
              {STEP3B_SUBTITLE_TEMPLATE.replace('{industry}', industry)}
            </p>
          </div>
          <div className="flex shrink-0 flex-nowrap gap-3">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              aria-label="智能优化"
              className="ikb-focusring"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '10px 16px',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.ink,
                cursor: canBulkActions ? 'pointer' : 'not-allowed',
                opacity: canBulkActions ? 1 : 0.4,
                transition: 'background 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">auto_fix_high</span>
              智能优化
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={!hasRealResult}
              aria-label="复制全部"
              className="ikb-focusring"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: '10px 16px',
                fontFamily: F.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.ink,
                cursor: hasRealResult ? 'pointer' : 'not-allowed',
                opacity: hasRealResult ? 1 : 0.4,
                transition: 'background 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">content_copy</span>
              复制全部
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!hasRealResult}
              aria-label="导出人设方案"
              className="ikb-gradbtn"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                padding: '10px 18px',
                fontFamily: F.cn,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                border: 'none',
                cursor: hasRealResult ? 'pointer' : 'not-allowed',
                opacity: hasRealResult ? 1 : 0.4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">download</span>
              导出人设方案
            </button>
          </div>
        </header>

        {/* ── 输入人设参数 ───────────────────────────────────── */}
        <section
          style={{
            position: 'relative',
            border: `1px solid ${C.line}`,
            background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
            padding: 24,
            marginBottom: 48,
            overflow: 'hidden',
          }}
        >
          {/* 装饰光晕 */}
          <div
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              right: -64,
              top: -64,
              height: 176,
              width: 176,
              borderRadius: '50%',
              background: `${C.ikb}08`,
              filter: 'blur(32px)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              bottom: -80,
              left: '33%',
              height: 176,
              width: 176,
              borderRadius: '50%',
              background: `${C.burgundy}06`,
              filter: 'blur(32px)',
            }}
          />

          {/* 段落标题 */}
          <div
            style={{
              position: 'relative',
              marginBottom: 24,
              paddingBottom: 20,
              borderBottom: `1px solid ${C.line}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: C.grad,
                  color: '#fff',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">tune</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>输入人设参数</h2>
                <p style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>填写基础信息 · AI 据此生成深度人设分析报告</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                background: `${C.ikb}15`,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: C.ikb,
                fontFamily: F.mono,
                letterSpacing: '0.04em',
              }}
            >
              <span
                style={{
                  height: 6,
                  width: 6,
                  borderRadius: '50%',
                  background: C.ikb,
                  animation: 'ikb-pulse 1.6s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              参数就绪
            </span>
          </div>

          {/* 表单 */}
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* 目标平台 · 可视化平台卡 */}
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend
                  style={{
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: C.ink,
                    fontFamily: F.cn,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      height: 14,
                      width: 3,
                      background: C.grad,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  目标平台
                </legend>
                <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="目标平台">
                  {PLATFORMS.map((p) => {
                    const active = platform === p.key;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPlatform(p.key)}
                        className="ikb-hovercard ikb-focusring"
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          overflow: 'hidden',
                          border: active ? `2px solid ${C.ikb}` : `1px solid ${C.line}`,
                          background: active ? `${C.ikb}08` : C.paper,
                          padding: '14px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: active ? `0 2px 12px ${C.ikb}20` : 'none',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            height: 40,
                            width: 40,
                            flexShrink: 0,
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            backgroundColor: p.color,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 22 }} aria-hidden="true">{p.icon}</span>
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>{p.label}</span>
                          <span style={{ display: 'block', fontSize: 11, color: '#6b7280', fontFamily: F.mono }}>{p.desc}</span>
                        </span>
                        <span
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: 10,
                            display: 'flex',
                            height: 16,
                            width: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: active ? C.ikb : C.paper,
                            border: active ? 'none' : `1px solid ${C.line}`,
                            color: active ? '#fff' : 'transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden="true">check</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* 目标受众 · 带图标输入 */}
              <div>
                <label
                  htmlFor="s3b-audience"
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: C.ink,
                    fontFamily: F.cn,
                  }}
                >
                  <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                  目标受众
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#6b7280', pointerEvents: 'none' }} aria-hidden="true">groups</span>
                  <input
                    id="s3b-audience"
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder={STEP3B_AUDIENCE.placeholder}
                    className="ikb-input"
                    style={{
                      width: '100%',
                      border: `1px solid ${C.line}`,
                      background: C.paper,
                      padding: '12px 12px 12px 40px',
                      fontSize: 14,
                      fontFamily: F.cn,
                      color: C.ink,
                      transition: 'border-color 0.2s',
                    }}
                  />
                </div>
              </div>

              {/* 你的个人信息 · 框式编辑器 */}
              <div>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    htmlFor="s3b-personalInfo"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: C.ink,
                      fontFamily: F.cn,
                    }}
                  >
                    <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                    你的个人信息{' '}
                    <span style={{ marginLeft: 4, color: C.burgundyText }}>*</span>
                  </label>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.burgundyText }} aria-hidden="true">auto_awesome</span>
                    AI 据此提取人设关键词
                  </span>
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    border: `1px solid ${C.line}`,
                    background: C.paper,
                    transition: 'border-color 0.2s',
                  }}
                  onFocusCapture={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = C.ikb;
                    (e.currentTarget as HTMLDivElement).style.outline = `1px solid ${C.ikb}`;
                  }}
                  onBlurCapture={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = C.line;
                    (e.currentTarget as HTMLDivElement).style.outline = 'none';
                  }}
                >
                  <textarea
                    id="s3b-personalInfo"
                    required
                    value={personalInfo}
                    onChange={(e) => setPersonalInfo(e.target.value)}
                    rows={6}
                    placeholder="详细描述你的个人背景、专业技能、从业经验、擅长领域、个人特点等。"
                    className="ikb-input"
                    style={{
                      width: '100%',
                      resize: 'none',
                      border: 0,
                      background: 'transparent',
                      padding: 16,
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontFamily: F.cn,
                      color: C.ink,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderTop: `1px solid ${C.line}`,
                      background: `${C.paper}99`,
                      padding: '10px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>可包含</span>
                      {['背景', '经历', '技能', '转型', '成就'].map((t) => (
                        <span
                          key={t}
                          style={{
                            borderRadius: 999,
                            background: `${C.ikb}10`,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            color: C.purpleText,
                            fontFamily: F.mono,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, color: '#6b7280' }}>{personalInfo.length} 字</span>
                  </div>
                </div>
              </div>

              {/* 个人优势 + 个人故事 · 双列框式编辑器 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="s3b-advantage"
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: C.ink,
                      fontFamily: F.cn,
                    }}
                  >
                    <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                    个人优势/特长
                  </label>
                  <div
                    style={{
                      overflow: 'hidden',
                      border: `1px solid ${C.line}`,
                      background: C.paper,
                      transition: 'border-color 0.2s',
                    }}
                    onFocusCapture={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = C.ikb;
                      (e.currentTarget as HTMLDivElement).style.outline = `1px solid ${C.ikb}`;
                    }}
                    onBlurCapture={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = C.line;
                      (e.currentTarget as HTMLDivElement).style.outline = 'none';
                    }}
                  >
                    <textarea
                      id="s3b-advantage"
                      value={personalAdvantage}
                      onChange={(e) => setPersonalAdvantage(e.target.value)}
                      rows={4}
                      placeholder="你有什么独特的优势？比如：独特的经历、专业证书、成功案例、个人特质..."
                      className="ikb-input"
                      style={{
                        width: '100%',
                        resize: 'none',
                        border: 0,
                        background: 'transparent',
                        padding: 16,
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: F.cn,
                        color: C.ink,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${C.line}`, background: `${C.paper}99`, padding: '8px 16px' }}>
                      <span style={{ fontSize: 11, fontFamily: F.mono, color: '#6b7280' }}>{personalAdvantage.length} 字</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="s3b-story"
                    style={{
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: C.ink,
                      fontFamily: F.cn,
                    }}
                  >
                    <span style={{ display: 'inline-block', height: 14, width: 3, background: C.grad, flexShrink: 0 }} aria-hidden="true" />
                    个人故事/经历
                  </label>
                  <div
                    style={{
                      overflow: 'hidden',
                      border: `1px solid ${C.line}`,
                      background: C.paper,
                      transition: 'border-color 0.2s',
                    }}
                    onFocusCapture={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = C.ikb;
                      (e.currentTarget as HTMLDivElement).style.outline = `1px solid ${C.ikb}`;
                    }}
                    onBlurCapture={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = C.line;
                      (e.currentTarget as HTMLDivElement).style.outline = 'none';
                    }}
                  >
                    <textarea
                      id="s3b-story"
                      value={personalStory}
                      onChange={(e) => setPersonalStory(e.target.value)}
                      rows={4}
                      placeholder="分享你的个人故事：为什么做这个行业？有什么转折点？什么经历让你与众不同？"
                      className="ikb-input"
                      style={{
                        width: '100%',
                        resize: 'none',
                        border: 0,
                        background: 'transparent',
                        padding: 16,
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: F.cn,
                        color: C.ink,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${C.line}`, background: `${C.paper}99`, padding: '8px 16px' }}>
                      <span style={{ fontSize: 11, fontFamily: F.mono, color: '#6b7280' }}>{personalStory.length} 字</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={!personalInfo.trim() || isLoading}
                  aria-label={isLoading ? '生成中…生成专属人设方案' : '生成专属人设方案'}
                  className="ikb-gradbtn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 32px',
                    fontFamily: F.cn,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    border: 'none',
                    cursor: (!personalInfo.trim() || isLoading) ? 'not-allowed' : 'pointer',
                    opacity: (!personalInfo.trim() || isLoading) ? 0.4 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">auto_awesome</span>
                  {isLoading ? '生成中…' : STEP3B_CTA_LABEL}
                </button>
              </div>
            </form>
          </div>
        </section>

        {generateMutation.isPending && (
          <div
            data-testid="step3b-loading"
            style={{
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${C.ikb}30`,
              background: `${C.ikb}08`,
              padding: 16,
              fontSize: 14,
              fontWeight: 500,
              color: C.purpleText,
              fontFamily: F.cn,
            }}
          >
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20, color: C.ikb }} aria-hidden="true">progress_activity</span>
            {STEP3B_LOADING_TEXT}
          </div>
        )}

        {generateMutation.isError && (
          <div
            data-testid="step3b-error"
            style={{
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              border: '1px solid #dc262630',
              background: '#fef2f2',
              padding: 16,
              fontSize: 14,
              fontWeight: 500,
              color: '#991b1b',
              fontFamily: F.cn,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">error</span>
              {generateMutation.error?.message ?? '生成失败，请重试'}
            </div>
            <button
              type="button"
              onClick={() =>
                generateMutation.mutate({
                  stepKey: 'step3b',
                  inputs: { personalInfo, personalAdvantage, personalStory, platform, audience },
                })
              }
              aria-label="重试重新生成"
              className="ikb-focusring"
              style={{
                flexShrink: 0,
                border: '1px solid #dc262630',
                background: '#fff',
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: '#991b1b',
                cursor: 'pointer',
                fontFamily: F.mono,
              }}
            >
              重试
            </button>
          </div>
        )}

        {dbQuery.isLoading && (
          <div
            data-testid="step3b-db-loading"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${C.ikb}20`,
              background: `${C.base}`,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.purpleText,
              fontFamily: F.cn,
            }}
          >
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18, color: C.ikb }} aria-hidden="true">progress_activity</span>
            正在加载历史记录…
          </div>
        )}

        {dbQuery.isError && !hasRealResult && (
          <div
            data-testid="step3b-db-error"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              border: '1px solid #dc262630',
              background: '#fef2f2',
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: '#991b1b',
              fontFamily: F.cn,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">error</span>
              历史记录加载失败，请重试
            </div>
            <button
              type="button"
              onClick={() => void dbQuery.refetch()}
              aria-label="重试重新加载历史记录"
              className="ikb-focusring"
              style={{
                flexShrink: 0,
                border: '1px solid #dc262630',
                background: '#fff',
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: '#991b1b',
                cursor: 'pointer',
                fontFamily: F.mono,
              }}
            >
              重试
            </button>
          </div>
        )}

        {hasRealResult && isFallbackFlag && (
          <div
            data-testid="step3b-fallback-notice"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${C.accent3}40`,
              background: `${C.accent3}08`,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.purpleText,
              fontFamily: F.cn,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.accent3 }} aria-hidden="true">warning</span>
            AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
          </div>
        )}

        {!hasRealResult && !generateMutation.isPending && !dbQuery.isLoading && (
          <div
            data-testid="step3b-empty-state"
            style={{
              marginBottom: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px dashed ${C.line}`,
              background: C.base,
              padding: '64px 0',
              textAlign: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ marginBottom: 16, fontSize: 48, color: `${C.ink}30` }} aria-hidden="true">person_search</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0 }}>尚未生成人设方案</p>
            <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280', fontFamily: F.cn }}>填写上方表单，点击「生成专属人设方案」开始分析</p>
          </div>
        )}

        {/* ── 报告区 · 仅有真实数据时显示 ──────────────────────── */}
        {hasRealResult && (
        <>
        {/* ── KPI 卡一排 ─────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          {/* 人设完整度 · 环形进度 · 蓝 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}15`, color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">verified</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 999,
                  background: `${C.ikb}15`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">trending_up</span>
                +18%
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                  88<span style={{ fontSize: 15, color: '#6b7280' }}>%</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>人设完整度</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}20`} strokeWidth="3.5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={C.ikb}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="88 100"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 记忆锚点 · 迷你柱 · 玫红 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.burgundy}15`, color: C.burgundyText }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">push_pin</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  background: `${C.burgundy}15`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.burgundyText,
                  fontFamily: F.mono,
                }}
              >
                已评估
              </span>
            </div>
            <div className="mt-4">
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                {result.coreIdentity.memoryPoints.length}
                <span style={{ fontSize: 15, color: '#6b7280' }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>记忆锚点</p>
            </div>
            <div className="mt-3 flex h-6 items-end gap-1">
              {[58, 84, 70, 96, 78].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: `${C.burgundy}B0`, height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* 内容支柱 · 进度条 · 紫 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.accent3}18`, color: C.purpleText }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">view_column</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  background: `${C.accent3}18`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.purpleText,
                  fontFamily: F.mono,
                }}
              >
                全覆盖
              </span>
            </div>
            <div className="mt-4">
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                {result.contentPersona.contentPillars.length}
                <span style={{ fontSize: 15, color: '#6b7280' }}> 个</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>内容支柱</p>
            </div>
            <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 999, background: `${C.accent3}20` }}>
              <div style={{ height: 8, width: '100%', borderRadius: 999, background: C.grad }} />
            </div>
          </div>

          {/* 信任背书 · 关键词 chip · 蓝 */}
          <div
            className="ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: C.paper,
              padding: 20,
            }}
          >
            <div className="flex items-center justify-between">
              <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}15`, color: C.ikb }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">shield_with_heart</span>
              </span>
              <span
                style={{
                  borderRadius: 999,
                  background: `${C.ikb}15`,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                {result.trustSystem.backings.length} 项
              </span>
            </div>
            <div className="mt-4">
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>
                {result.trustSystem.backings.length}
                <span style={{ fontSize: 15, color: '#6b7280' }}> 项</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>信任背书</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['实战案例', '客户反馈', '历程背书'].slice(0, 3).map((k) => (
                <span
                  key={k}
                  style={{
                    background: `${C.ikb}12`,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 结果区(3 列 bento)─────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">
          {/* 左 2 列 */}
          <div className="col-span-2 space-y-6">
            {/* Core Identity · 白底 + 顶部 3px 渐变色条 */}
            <section
              style={{
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${C.line}`,
                background: C.paper,
                padding: 0,
              }}
            >
              {/* 顶部 3px 渐变色条 */}
              <div style={{ height: 3, width: '100%', background: C.grad }} aria-hidden="true" />
              {/* 装饰光晕(极淡,装饰用) */}
              <div style={{ pointerEvents: 'none', position: 'absolute', right: -40, top: -40, height: 192, width: 192, borderRadius: '50%', background: `${C.ikb}05`, filter: 'blur(40px)' }} aria-hidden="true" />
              <div style={{ pointerEvents: 'none', position: 'absolute', bottom: -40, left: '40%', height: 120, width: 120, borderRadius: '50%', background: `${C.burgundy}05`, filter: 'blur(32px)' }} aria-hidden="true" />
              <div style={{ position: 'relative', zIndex: 10, padding: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                  <div>
                    <h3 style={{ marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#6b7280', fontFamily: F.mono, letterSpacing: '0.04em' }}>
                      核心定位基因 (Core Identity)
                    </h3>
                    <div
                      style={{
                        marginBottom: 16,
                        fontSize: 22,
                        fontWeight: 700,
                        lineHeight: 1.3,
                        fontFamily: F.display,
                        background: C.grad,
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                      }}
                    >
                      {result.coreIdentity.identityTag}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {result.coreIdentity.traits.map((t) => (
                        <span
                          key={t.name}
                          style={{
                            borderRadius: 999,
                            border: `1px solid ${C.line}`,
                            background: C.base,
                            padding: '4px 12px',
                            fontSize: 13,
                            fontWeight: 500,
                            color: C.ink,
                            fontFamily: F.cn,
                          }}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      height: 128,
                      width: 128,
                      flexShrink: 0,
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      border: `4px solid ${C.line}`,
                      background: C.base,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', fontFamily: F.mono }}>ID</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.display }}>#72421</span>
                    <div style={{ position: 'absolute', bottom: -8, right: -8, height: 24, width: 24, borderRadius: '50%', border: `2px solid ${C.paper}`, background: C.burgundy }} aria-hidden="true" />
                  </div>
                </div>
                <div style={{ marginTop: 32, borderTop: `1px solid ${C.line}`, paddingTop: 24 }}>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: F.cn }}>
                    {result.coreIdentity.differentiation}
                  </p>
                </div>
              </div>
            </section>

            {/* IP 孵化成长路线图 */}
            <section style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 32 }}>
              <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
                <span className="material-symbols-outlined" style={{ color: C.ikb }} aria-hidden="true">timeline</span>
                IP 孵化成长路线图
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {result.roadmap.map((r, i) => {
                  const accent = ACCENT[r.accent] ?? C.ikb;
                  return (
                    <div key={r.period} style={{ border: `1px solid ${C.line}`, background: C.base, padding: 20 }}>
                      <div style={{ marginBottom: 8, height: 12, width: 12, borderRadius: '50%', backgroundColor: accent }} aria-hidden="true" />
                      <div
                        style={{
                          marginBottom: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: accent,
                          fontFamily: F.mono,
                        }}
                      >
                        阶段 {String(i + 1).padStart(2, '0')}
                      </div>
                      <h4 style={{ marginBottom: 8, fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>{r.period}</h4>
                      <p style={{ fontSize: 12, lineHeight: 1.6, color: '#6b7280', fontFamily: F.cn }}>{r.goal}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 信任背书体系 */}
            <section style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 32 }}>
              <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>信任背书体系</h3>
              <div className="grid grid-cols-3 gap-4">
                {result.trustSystem.backings.slice(0, 3).map((b) => (
                  <div
                    key={b.claim}
                    className="ikb-hovercard"
                    style={{
                      border: `1px solid ${C.line}`,
                      background: C.base,
                      padding: 16,
                    }}
                  >
                    <div style={{ marginBottom: 12, display: 'flex', height: 32, width: 32, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}18`, color: C.ikb }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">verified</span>
                    </div>
                    <h4 style={{ marginBottom: 4, fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: C.ink, fontFamily: F.cn }}>{b.claim}</h4>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: '#6b7280', fontFamily: F.cn }}>{b.display}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 右 1 列 · 内容矩阵占比 */}
          <div className="space-y-6">
            <section style={{ display: 'flex', height: '100%', flexDirection: 'column', border: `1px solid ${C.line}`, background: C.paper, padding: 24 }}>
              <h3 style={{ marginBottom: 4, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>内容矩阵占比</h3>
              <p style={{ marginBottom: 24, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>
                基于算法优化的最佳内容输出配比，平衡专业深度与受众广度。
              </p>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {result.contentPersona.contentPillars.map((p, i) => {
                  const pct = parseInt(String(p.percentage), 10) || 0;
                  const color = BAR_COLORS[i % BAR_COLORS.length];
                  return (
                    <div key={p.title}>
                      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: F.cn }}>{p.title}</span>
                        <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color, fontFamily: F.mono }}>{p.percentage}</span>
                      </div>
                      <div style={{ height: 8, width: '100%', borderRadius: 999, background: `${C.line}` }}>
                        <div
                          style={{ height: 8, borderRadius: 999, backgroundColor: color, width: `${pct}%` }}
                        />
                      </div>
                      <p style={{ marginTop: 4, fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>{p.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 24, borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: C.ikb, fontFamily: F.cn }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', background: C.ikb, display: 'inline-block' }} aria-hidden="true" />
                  配比状态健康，建议持续执行
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── P0 补充区块 · 思想体系 / 内容人设 / 信任体系补充 ─── */}

        {/* 思想体系 · thoughtSystem */}
        <section style={{ marginTop: 24, border: `1px solid ${C.line}`, background: C.paper, padding: 32 }}>
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}15`, color: C.ikb }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">lightbulb</span>
            </span>
            思想体系
          </h3>

          {/* 核心信念 coreBeliefs */}
          <div style={{ marginBottom: 32 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span style={{ height: 4, width: 16, borderRadius: 999, background: C.ikb, display: 'inline-block' }} aria-hidden="true" />
              核心信念
            </h4>
            <div className="space-y-4">
              {result.thoughtSystem.coreBeliefs.map((cb, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${C.line}`,
                    background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
                    padding: 20,
                  }}
                >
                  <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span
                      style={{
                        marginTop: 2,
                        display: 'flex',
                        height: 24,
                        width: 24,
                        flexShrink: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: C.ikb,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        fontFamily: F.mono,
                      }}
                    >
                      {i + 1}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: C.ink, fontFamily: F.cn, margin: 0 }}>{cb.belief}</p>
                  </div>
                  <p style={{ marginBottom: 8, paddingLeft: 36, fontSize: 13, lineHeight: 1.6, color: '#6b7280', fontFamily: F.cn }}>{cb.reason}</p>
                  <div style={{ marginLeft: 36, border: `1px solid ${C.ikb}30`, background: `${C.ikb}08`, padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>内容角度 · </span>
                    <span style={{ fontSize: 12, color: '#374151', fontFamily: F.cn }}>{cb.angle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 独特观点 viewpoints */}
          <div style={{ marginBottom: 32 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span style={{ height: 4, width: 16, borderRadius: 999, background: C.burgundy, display: 'inline-block' }} aria-hidden="true" />
              独特观点
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {result.thoughtSystem.viewpoints.map((vp, i) => (
                <div
                  key={i}
                  style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 20 }}
                >
                  <p style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: C.ink, fontFamily: F.cn }}>{vp.title}</p>
                  <p style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.6, color: '#6b7280', fontFamily: F.cn }}>{vp.desc}</p>
                  <div style={{ border: `1px solid ${C.burgundy}30`, background: `${C.burgundy}08`, padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.burgundyText, fontFamily: F.mono }}>示例标题 · </span>
                    <span style={{ fontSize: 12, color: '#374151', fontFamily: F.cn }}>{vp.exampleTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 品牌金句 mottos */}
          <div>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span style={{ height: 4, width: 16, borderRadius: 999, background: C.accent3, display: 'inline-block' }} aria-hidden="true" />
              品牌金句
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {result.thoughtSystem.mottos.map((m, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${C.accent3}40`,
                    background: `linear-gradient(135deg, ${C.accent3}08 0%, ${C.paper} 100%)`,
                    padding: 20,
                  }}
                >
                  <p style={{ marginBottom: 12, fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: C.purpleText, fontFamily: F.display }}>{m.motto}</p>
                  <div style={{ marginBottom: 6, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>
                    <span style={{ fontWeight: 600, color: C.ink }}>使用时机 · </span>
                    {m.whenToUse}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>
                    <span style={{ fontWeight: 600, color: C.ink }}>效果 · </span>
                    {m.effect}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 内容人设 · contentPersona */}
        <section style={{ marginTop: 24, border: `1px solid ${C.line}`, background: C.paper, padding: 32 }}>
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.burgundy}15`, color: C.burgundyText }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">person_play</span>
            </span>
            内容人设
          </h3>

          {/* 表达风格 speakingStyle */}
          <div
            style={{
              marginBottom: 24,
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.burgundy}06 100%)`,
              padding: 20,
            }}
          >
            <h4 style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: C.burgundyText, fontFamily: F.cn }}>表达风格</h4>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: F.cn }}>
              {result.contentPersona.speakingStyle}
            </p>
          </div>

          {/* Dos & Donts */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div style={{ border: '1px solid #dcfce7', background: '#f0fdf4', padding: 20 }}>
              <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#166534', fontFamily: F.cn }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">check_circle</span>
                建议这样说
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.contentPersona.speakingDos.map((d, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: F.cn }}>
                    <span style={{ marginTop: 6, height: 6, width: 6, flexShrink: 0, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ border: '1px solid #fee2e2', background: '#fff5f5', padding: 20 }}>
              <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#991b1b', fontFamily: F.cn }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">cancel</span>
                避免这样说
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.contentPersona.speakingDonts.map((d, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: F.cn }}>
                    <span style={{ marginTop: 6, height: 6, width: 6, flexShrink: 0, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 示例开场白 examplePitch */}
          <div style={{ marginBottom: 24, border: `1px solid ${C.line}`, background: C.base, padding: 20 }}>
            <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.ikb }} aria-hidden="true">record_voice_over</span>
              示例开场白
            </h4>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap', fontFamily: F.cn }}>
              {result.contentPersona.examplePitch}
            </p>
          </div>

          {/* 视觉形象 visualStyle */}
          <div>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.burgundyText }} aria-hidden="true">style</span>
              视觉形象建议
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 16 }}>
                <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>整体风格</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: F.cn }}>
                  {result.contentPersona.visualStyle.style}
                </p>
              </div>
              <div style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 16 }}>
                <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, color: C.burgundyText, fontFamily: F.mono }}>穿搭建议</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: F.cn }}>
                  {result.contentPersona.visualStyle.outfit}
                </p>
              </div>
              <div style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 16 }}>
                <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 700, color: C.purpleText, fontFamily: F.mono }}>场景选择</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: F.cn }}>
                  {result.contentPersona.visualStyle.scene}
                </p>
              </div>
            </div>
            {result.contentPersona.visualStyle.props.length > 0 && (
              <div style={{ marginTop: 16, border: `1px solid ${C.line}`, background: C.base, padding: '16px 20px' }}>
                <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: F.cn }}>道具清单</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.contentPersona.visualStyle.props.map((prop) => (
                    <span
                      key={prop}
                      style={{
                        border: `1px solid ${C.line}`,
                        background: C.paper,
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#374151',
                        borderRadius: 999,
                        fontFamily: F.cn,
                      }}
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 信任体系补充 · trustSystem socialProofs + storyLine */}
        <section style={{ marginTop: 24, border: `1px solid ${C.line}`, background: C.paper, padding: 32 }}>
          <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
            <span style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', background: `${C.accent3}18`, color: C.purpleText }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">workspace_premium</span>
            </span>
            信任体系 · 社会证明与故事线
          </h3>

          {/* 社会证明 socialProofs */}
          <div style={{ marginBottom: 32 }}>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span style={{ height: 4, width: 16, borderRadius: 999, background: C.ikb, display: 'inline-block' }} aria-hidden="true" />
              社会证明
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {result.trustSystem.socialProofs.map((sp, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${C.line}`,
                    background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
                    padding: 20,
                  }}
                >
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ display: 'flex', height: 32, width: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', background: `${C.ikb}15`, color: C.ikb }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">thumb_up</span>
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: C.ink, fontFamily: F.cn, margin: 0 }}>{sp.proof}</p>
                  </div>
                  <div style={{ border: `1px solid ${C.ikb}25`, background: `${C.ikb}08`, padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ikb, fontFamily: F.mono }}>落地方式 · </span>
                    <span style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: F.cn }}>{sp.method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 故事线 storyLine */}
          <div>
            <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn }}>
              <span style={{ height: 4, width: 16, borderRadius: 999, background: C.burgundy, display: 'inline-block' }} aria-hidden="true" />
              IP 故事线
            </h4>
            <div className="space-y-4">
              <div
                style={{
                  border: `1px solid ${C.line}`,
                  background: `linear-gradient(135deg, ${C.paper} 0%, ${C.burgundy}05 100%)`,
                  padding: 20,
                }}
              >
                <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.burgundyText, fontFamily: F.mono }}>核心故事</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: F.cn }}>
                  {result.trustSystem.storyLine.mainStory}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div style={{ border: `1px solid ${C.line}`, background: C.paper, padding: 20 }}>
                  <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.ikb, fontFamily: F.mono }}>关键转折点</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: F.cn }}>
                    {result.trustSystem.storyLine.turningPoint}
                  </p>
                </div>
                <div style={{ border: `1px solid ${C.accent3}40`, background: `${C.accent3}06`, padding: 20 }}>
                  <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.purpleText, fontFamily: F.mono }}>叙事方式</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: F.cn }}>
                    {result.trustSystem.storyLine.narrationMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden="true">insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>· AI 综合评估 · 综合示意</span>
        </div>
        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* 人设竞争力雷达 */}
          <div
            className="col-span-5 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${C.ikb}15`,
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>人设竞争力雷达</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>六维模型评估</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ikb, fontFamily: F.display, margin: 0 }}>85</p>
                <p style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono, margin: 0 }}>综合分</p>
              </div>
            </div>
            {(() => {
              const dims = RADAR_DIMS;
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" className="w-full" role="img" aria-label="人设竞争力雷达图：六维模型评估">
                  <title>人设竞争力雷达图</title>
                  <defs>
                    <linearGradient id="s3b-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke={C.line} strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#s3b-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#6b7280" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div className="mt-2 grid grid-cols-3 gap-y-2">
              {RADAR_DIMS.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6 个月影响力预估 */}
          <div
            className="col-span-7 ikb-hovercard"
            style={{
              border: `1px solid ${C.line}`,
              background: `linear-gradient(135deg, ${C.paper} 0%, ${C.base} 100%)`,
              padding: 24,
            }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${C.burgundy}15`,
                    color: C.burgundyText,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0 }}>6 个月影响力预估</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', fontFamily: F.cn, margin: 0 }}>按当前人设矩阵测算</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['曝光', '涨粉', '互动'].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 4,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: F.mono,
                      background: i === 0 ? C.ikb : `${C.ikb}12`,
                      color: i === 0 ? '#fff' : '#6b7280',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-3 flex items-end gap-3">
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0 }}>38.5K</p>
              <span
                style={{
                  marginBottom: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 999,
                  background: `${C.ikb}15`,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.ikb,
                  fontFamily: F.mono,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">trending_up</span>
                +186%
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: '#6b7280', fontFamily: F.cn }}>较冷启动基线</span>
            </div>
            {(() => {
              const data = TREND_DATA;
              const W = 560;
              const H = 168;
              const padL = 6;
              const padR = 6;
              const padT = 12;
              const padB = 8;
              const innerW = W - padL - padR;
              const innerH = H - padT - padB;
              const max = 110;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="6 个月影响力预估趋势图">
                  <title>6 个月影响力预估趋势图</title>
                  <defs>
                    <linearGradient id="s3b-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="s3b-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="100%" stopColor={C.burgundy} />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke={C.line}
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area} fill="url(#s3b-trendFill)" />
                  <path d={line} fill="none" stroke="url(#s3b-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) =>
                    i % 2 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div className="mt-1 flex justify-between px-1">
              {TREND_LABELS.map((m) => (
                <span key={m} style={{ fontSize: 10, color: '#6b7280', fontFamily: F.mono }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </IKBLayout>
  );
}
