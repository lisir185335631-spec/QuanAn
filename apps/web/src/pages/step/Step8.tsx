// PRD-29.12 · Step8 直播策划 · 液态玻璃 iOS26 换皮(业务逻辑/状态/提交/校验不变)
import { motion } from 'framer-motion';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep } from '@/hooks/useStepData';
import { stepLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

// ─── LivestreamAgent result type (generate_plan sub_function) ────────────────

/** Mirrors GeneratePlanOutput from LivestreamAgent · 6-module JSON */
export interface Step8LivestreamResult {
  opening: string;
  warmup: string;
  product: string;
  conversion: string;
  faq: string;
  closing: string;
}

/** Runtime guard — avoids bare `as` casts */
function isStep8Result(x: unknown): x is Step8LivestreamResult {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.opening === 'string' &&
    typeof r.warmup === 'string' &&
    typeof r.product === 'string' &&
    typeof r.conversion === 'string' &&
    typeof r.faq === 'string' &&
    typeof r.closing === 'string'
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step8FormData {
  productInfo: string;
  targetAudience: string;
  platform: string;
  experience: 'newbie' | 'intermediate' | 'expert';
}

interface Step8StageDetail {
  index: number;
  name: string;
  duration: string;
  accent: 'normal' | 'green' | 'orange' | 'red';
  scriptLabel: string;
  script: string;
  actions?: string[];
  hooks?: string[];
  interaction?: string;
  conversion?: string;
  urgencyTags?: string[];
  closeTechniques?: string[];
  nextPreview?: string;
}


// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FORM: Step8FormData = {
  productInfo: '定制智能体定价：10000-100000（根据客户需求专业定制）\n针对opc创业者：自己做ip获取流量，9800线上智能体使用和19800线下高阶段培训\n技术升级项目落地培训29800，训练营',
  targetAudience: '需要定制智能体降本增效的老板和opc创业者',
  platform: 'douyin',
  experience: 'newbie',
};

const EXPERIENCE_OPTIONS = [
  { value: 'newbie' as const, label: '新手', sub: '刚开始做直播', icon: 'rocket_launch', color: C.ikb },
  { value: 'intermediate' as const, label: '有经验', sub: '有一定直播经验', icon: 'trending_up', color: C.ikb },
  { value: 'expert' as const, label: '资深', sub: '直播经验丰富', icon: 'star', color: C.ikb },
];

const PLATFORMS = [
  { id: 'douyin', label: '抖音', icon: 'music_note', color: '#0ea5b7', desc: '短视频 · 流量' },
  { id: 'xiaohongshu', label: '小红书', icon: 'menu_book', color: '#ff2442', desc: '种草 · 图文' },
  { id: 'shipinhao', label: '视频号', icon: 'smart_display', color: '#07c160', desc: '私域 · 转化' },
  { id: 'kuaishou', label: '快手', icon: 'bolt', color: '#ff7a00', desc: '下沉 · 互动' },
  { id: 'bilibili', label: 'B站', icon: 'smart_display', color: '#fb7299', desc: '知识 · 社区' },
];

// ─── accent → 液态玻璃冷蓝色映射 ─────────────────────────────────────────────

function accentColor(accent: Step8StageDetail['accent']): string {
  // 液态玻璃体系:全部用冷蓝系变体
  if (accent === 'green') return C.ikb;
  if (accent === 'orange') return C.accent3;
  if (accent === 'red') return 'rgba(255,255,255,0.95)';
  return C.ikb;
}

function accentText(accent: Step8StageDetail['accent']): string {
  if (accent === 'orange') return C.purpleText;
  if (accent === 'red') return C.burgundyText;
  return C.ikb;
}

function accentBg(accent: Step8StageDetail['accent']): string {
  // rgba 字面量避免 hex+alpha 拼接坑
  if (accent === 'green') return 'rgba(168,197,224,0.12)';
  if (accent === 'orange') return 'rgba(168,197,224,0.10)';
  if (accent === 'red') return 'rgba(255,255,255,0.08)';
  return 'rgba(168,197,224,0.12)';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Step8() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const industry = readOtherStep<{ industry?: string }>(accountId, 'step1')?.industry ?? '美业';

  const [productInfo, setProductInfo] = useState(DEFAULT_FORM.productInfo);
  const [targetAudience, setTargetAudience] = useState(DEFAULT_FORM.targetAudience);
  const [platform, setPlatform] = useState(DEFAULT_FORM.platform);
  const [experience, setExperience] = useState<Step8FormData['experience']>(DEFAULT_FORM.experience);

  // PRD-29.12 · 真 query: stepData.get 进页即读取历史结果 (对齐 Step7: staleTime + retry:false)
  const dbQuery = trpc.stepData.get.useQuery(
    { stepKey: 'step8' },
    { enabled: accountId !== null, staleTime: 30_000, retry: false },
  );

  // PRD-29.12 · 真 mutation: stepData.save → LivestreamAgent.execute(generate_plan)
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

  // PRD-29.12 · 真数据来源(带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined (不再 fallback mock · Step3b 教训)
  // RouterOutputs typed — useMutation.data is already RouterOutputs['stepData']['save'] | undefined
  const mutationResult = generateMutation.data;
  const rawSession = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: Step8LivestreamResult | undefined = isStep8Result(rawSession) ? rawSession : undefined;
  const dbResult: Step8LivestreamResult | undefined = isStep8Result(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: Step8LivestreamResult | undefined = sessionResult ?? dbResult;
  const hasResult = result !== undefined;
  const canBulkActions = hasResult && !isLoading;

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step8FormData>(accountId, 'step8');
    if (saved?.productInfo) {
      setProductInfo(saved.productInfo);
      if (saved.targetAudience) setTargetAudience(saved.targetAudience);
      if (saved.platform) setPlatform(saved.platform);
      if (saved.experience) setExperience(saved.experience);
    }
  }, [accountId]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    // Map experience value to Chinese label expected by LivestreamAgent
    const expMap: Record<Step8FormData['experience'], string> = {
      newbie: '新手',
      intermediate: '有经验',
      expert: '资深',
    };
    const formSnapshot: Step8FormData = { productInfo, targetAudience, platform, experience };
    // Write LS so readOtherStep('step8') can restore form state on next visit
    if (accountId !== null) {
      try {
        localStorage.setItem(stepLsKey(accountId, 'step8'), JSON.stringify(formSnapshot));
      } catch {
        // LS full — non-fatal, proceed with DB write
      }
    }
    generateMutation.mutate({
      stepKey: 'step8',
      inputs: {
        productInfo,
        targetAudience,
        platform,
        experience: expMap[experience],
        sub_function: 'generate_plan',
      },
    });
  }

  function handleRegenerateAll() {
    if (isLoading) return;
    const expMap: Record<Step8FormData['experience'], string> = {
      newbie: '新手',
      intermediate: '有经验',
      expert: '资深',
    };
    generateMutation.mutate({
      stepKey: 'step8',
      inputs: {
        productInfo,
        targetAudience,
        platform,
        experience: expMap[experience],
        sub_function: 'generate_plan',
      },
    });
  }

  function handleCopyAll() {
    if (!result) return;
    navigator.clipboard
      .writeText(JSON.stringify(result, null, 2))
      .then(() => toast.success('已复制全部'))
      .catch(() => toast.error('复制失败'));
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    // TODO: wire to optimize_script sub_function when UX flow is finalized
    toast.info('优化功能开发中');
  }

  function handleCopySection(label: string, text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`已复制${label}`))
      .catch(() => toast.error('复制失败'));
  }

  function handleViewIpPlan() {
    toast.info('IP 方案查看功能开发中');
  }

  // ── 数据洞察雷达维度 (直播转化力) — 液态玻璃冷蓝系
  const RADAR_DIMS_S8 = [
    { label: '流量获取', value: 82, color: C.ikb },
    { label: '互动设计', value: 88, color: C.accent3 },
    { label: '产品塑造', value: 76, color: C.ikb },
    { label: '逼单话术', value: 84, color: C.accent3 },
    { label: '留存转粉', value: 79, color: C.ikb },
    { label: '数据优化', value: 90, color: C.accent3 },
  ];

  // ── 趋势图数据 (7 环节在线人数)
  const TREND_DATA_S8 = [120, 180, 260, 320, 290, 350, 300];
  const TREND_LABELS_S8 = ['预热', '开场', '痛点共鸣', 'AI解析', '产品植入', '逼单', '收尾'];

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal>
        <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flexShrink: 0 }}>
            {/* chip 标签行 */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid ${C.line}`,
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                战略路径
              </span>
              <span
                style={{
                  borderRadius: 9999,
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  background: 'rgba(168,197,224,0.18)',
                  backdropFilter: 'blur(12px)',
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: C.ikb,
                  fontFamily: F.mono,
                  textShadow: C.textShadow,
                }}
              >
                直播脚本
              </span>
            </div>
            {/* 主标题 — 冷蓝渐变字 */}
            <h1
              style={{
                whiteSpace: 'nowrap',
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: F.display,
                margin: 0,
                background: C.grad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                textShadow: 'none',
              }}
            >
              STEP 08 · 直播策划
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 820,
                fontSize: 16,
                lineHeight: 1.6,
                color: C.burgundyText,
                fontFamily: F.cn,
                textShadow: C.textShadow,
              }}
            >
              当前行业：{industry}。AI 将生成完整的直播方案，包含详细话术、引流策略、互动设计，并支持 AI 优化直播脚本。
            </p>
          </div>
          {/* 操作按钮组 */}
          <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
            <motion.button
              type="button"
              onClick={handleRegenerateAll}
              disabled={isLoading}
              aria-label="重新生成"
              className="lg-glass"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.cn,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.4 : 1,
                borderRadius: 10,
                border: 'none',
                whiteSpace: 'nowrap',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.ikb }}>refresh</span>
              重新生成
            </motion.button>
            <motion.button
              type="button"
              onClick={handleOptimize}
              disabled={!canBulkActions}
              aria-label="智能优化"
              className="lg-glass"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: C.ink,
                fontFamily: F.cn,
                cursor: !canBulkActions ? 'not-allowed' : 'pointer',
                opacity: !canBulkActions ? 0.4 : 1,
                borderRadius: 10,
                border: 'none',
                whiteSpace: 'nowrap',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.ikb }}>auto_fix_high</span>
              智能优化
            </motion.button>
            <Magnetic strength={0.3}>
              <button
                type="button"
                onClick={handleCopyAll}
                aria-label="导出方案"
                className="lg-gradbtn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  fontFamily: F.cn,
                  cursor: 'pointer',
                  borderRadius: 9999,
                  border: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>download</span>
                导出方案
              </button>
            </Magnetic>
          </div>
        </header>
      </Reveal>

      {/* ── 输入卡 ───────────────────────────────────────────── */}
      <Reveal>
        <section
          className="lg-glass"
          style={{ position: 'relative', marginBottom: 40, overflow: 'hidden', borderRadius: 20, padding: 28 }}
        >
          {/* 卡头 */}
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `0.5px solid ${C.line}`,
              paddingBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className="lg-gradbtn"
                style={{
                  display: 'flex',
                  height: 44,
                  width: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  color: '#fff',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true}>podcasts</span>
              </span>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>直播策划参数</h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>填写产品信息与目标受众 · AI 据此生成三套完整直播脚本</p>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 9999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: 'rgba(168,197,224,0.18)',
                color: C.ikb,
                fontFamily: F.mono,
              }}
            >
              <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
              参数就绪
            </span>
          </div>

          {/* 表单 — 所有 onChange/onSubmit/状态/校验不变 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* 直播平台 · 5 可视化选择卡 */}
            <div>
              <span
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    marginRight: 4,
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                  }}
                />
                直播平台
              </span>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}
                role="radiogroup"
                aria-label="直播平台选择"
              >
                {PLATFORMS.map((p) => {
                  const active = platform === p.id;
                  return (
                    <motion.button
                      type="button"
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      aria-pressed={active}
                      className="lg-glass"
                      whileHover={{ y: -3 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        overflow: 'hidden',
                        borderRadius: 14,
                        padding: 14,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: active ? `1.5px solid rgba(168,197,224,0.65)` : undefined,
                        background: active ? 'rgba(168,197,224,0.18)' : undefined,
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
                          borderRadius: 10,
                          backgroundColor: p.color,
                          color: '#fff',
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>{p.icon}</span>
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{p.label}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{p.desc}</span>
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
                          background: active ? C.ikb : 'rgba(255,255,255,0.15)',
                          color: active ? '#fff' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 12 }}>check</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 直播经验 · 3 可视化选择卡 */}
            <div>
              <span
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                }}
              >
                <span
                  style={{
                    marginRight: 4,
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                  }}
                />
                直播经验
              </span>
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}
                role="radiogroup"
                aria-label="直播经验选择"
              >
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const active = experience === opt.value;
                  return (
                    <motion.button
                      type="button"
                      key={opt.value}
                      onClick={() => setExperience(opt.value)}
                      aria-pressed={active}
                      className="lg-glass"
                      whileHover={{ y: -3 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        overflow: 'hidden',
                        borderRadius: 14,
                        padding: 14,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: active ? `1.5px solid rgba(168,197,224,0.65)` : undefined,
                        background: active ? 'rgba(168,197,224,0.18)' : undefined,
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
                          borderRadius: 10,
                          background: active
                            ? 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))'
                            : 'rgba(255,255,255,0.08)',
                          color: active ? C.ikb : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22 }}>{opt.icon}</span>
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>{opt.label}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{opt.sub}</span>
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
                          background: active ? C.ikb : 'rgba(255,255,255,0.15)',
                          color: active ? '#fff' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 12 }}>check</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 产品/服务信息 · 玻璃框式编辑器 */}
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="s8-product-info"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      marginRight: 4,
                      display: 'inline-block',
                      height: 14,
                      width: 4,
                      borderRadius: 9999,
                      background: C.grad,
                    }}
                  />
                  产品/服务信息
                  <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.84)' }}>（可选）</span>
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14, color: C.ikb }}>auto_awesome</span>
                  AI 据此定制直播话术
                </span>
              </div>
              <div
                className="lg-glass"
                style={{ overflow: 'hidden', borderRadius: 14, transition: 'box-shadow 0.2s' }}
                onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(168,197,224,0.45)'; }}
                onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
              >
                <textarea
                  id="s8-product-info"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  rows={5}
                  placeholder="输入产品定价、服务内容、核心卖点等，AI 将据此生成专属直播脚本"
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 'none',
                    background: 'transparent',
                    padding: 16,
                    fontSize: 14,
                    lineHeight: 1.6,
                    outline: 'none',
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
                    borderTop: `0.5px solid ${C.line}`,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>可包含</span>
                    {['定价', '卖点', '服务范围', '成交案例', '课程体系'].map((t) => (
                      <span
                        key={t}
                        style={{
                          borderRadius: 9999,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          background: 'rgba(255,255,255,0.10)',
                          color: 'rgba(255,255,255,0.84)',
                          fontFamily: F.cn,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>{productInfo.length} 字</span>
                </div>
              </div>
            </div>

            {/* 目标受众 · 玻璃输入框 */}
            <div>
              <label
                htmlFor="s8-target-audience"
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: C.ink,
                  fontFamily: F.cn,
                  textShadow: C.textShadow,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    marginRight: 4,
                    display: 'inline-block',
                    height: 14,
                    width: 4,
                    borderRadius: 9999,
                    background: C.grad,
                  }}
                />
                目标受众
                <span style={{ marginLeft: 4, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.72)' }}>（可选）</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  aria-hidden={true}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.45)',
                    pointerEvents: 'none',
                  }}
                >
                  groups
                </span>
                <input
                  id="s8-target-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例如：需要降本增效的企业老板、OPC创业者"
                  className="lg-glass"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: 12,
                    padding: '12px 16px 12px 40px',
                    fontSize: 14,
                    outline: 'none',
                    border: 'none',
                    background: 'transparent',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                  }}
                  onFocus={(e) => {
                    const wrapper = e.currentTarget.closest('.lg-glass') as HTMLElement | null;
                    if (wrapper) wrapper.style.boxShadow = '0 0 0 2px rgba(168,197,224,0.45)';
                  }}
                  onBlur={(e) => {
                    const wrapper = e.currentTarget.closest('.lg-glass') as HTMLElement | null;
                    if (wrapper) wrapper.style.boxShadow = '';
                  }}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Magnetic strength={0.3}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="lg-gradbtn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    padding: '12px 32px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: F.cn,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.4 : 1,
                    border: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>mic</span>
                  {isLoading ? '生成中…' : '生成直播方案'}
                </button>
              </Magnetic>
            </div>
          </form>
        </section>
      </Reveal>

      {/* ── 三态 banners ───────────────────────────────── */}

      {/* Loading: mutation 进行中 */}
      {generateMutation.isPending && (
        <Reveal>
          <div
            data-testid="step8-loading"
            className="lg-glass"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.ikb,
              fontFamily: F.cn,
            }}
          >
            <span className="material-symbols-outlined animate-spin" aria-hidden={true} style={{ fontSize: 18 }}>progress_activity</span>
            AI 正在生成直播策划方案，预计 30-60 秒…
          </div>
        </Reveal>
      )}

      {/* Error: mutation 失败 */}
      {generateMutation.isError && !hasResult && (
        <Reveal>
          <div
            data-testid="step8-error"
            className="lg-glass"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.burgundyText,
              border: '0.5px solid rgba(255,255,255,0.22)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>error</span>
              生成失败：{generateMutation.error?.message ?? '请稍后重试'}
            </div>
            <motion.button
              type="button"
              onClick={handleRegenerateAll}
              className="lg-glass"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                flexShrink: 0,
                borderRadius: 10,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: C.ink,
                cursor: 'pointer',
                border: 'none',
                fontFamily: F.cn,
              }}
            >
              重试
            </motion.button>
          </div>
        </Reveal>
      )}

      {/* DB loading */}
      {dbQuery.isLoading && (
        <Reveal>
          <div
            data-testid="step8-db-loading"
            className="lg-glass"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.ikb,
              fontFamily: F.cn,
            }}
          >
            <span className="material-symbols-outlined animate-spin" aria-hidden={true} style={{ fontSize: 18 }}>progress_activity</span>
            正在加载历史记录…
          </div>
        </Reveal>
      )}

      {/* DB error */}
      {dbQuery.isError && !hasResult && (
        <Reveal>
          <div
            data-testid="step8-db-error"
            className="lg-glass"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.burgundyText,
              border: '0.5px solid rgba(255,255,255,0.22)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>error</span>
              历史记录加载失败，请重试
            </div>
            <motion.button
              type="button"
              onClick={() => void dbQuery.refetch()}
              className="lg-glass"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                flexShrink: 0,
                borderRadius: 10,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                color: C.ink,
                cursor: 'pointer',
                border: 'none',
                fontFamily: F.cn,
              }}
            >
              重试
            </motion.button>
          </div>
        </Reveal>
      )}

      {/* isFallback 降级提示 */}
      {hasResult && isFallbackFlag && (
        <Reveal>
          <div
            data-testid="step8-fallback-notice"
            className="lg-glass"
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              fontWeight: 500,
              color: C.purpleText,
              fontFamily: F.cn,
              border: '0.5px solid rgba(168,197,224,0.35)',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>warning</span>
            AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
          </div>
        </Reveal>
      )}

      {/* 空态: 无真数据 · 非 loading */}
      {!hasResult && !generateMutation.isPending && !dbQuery.isLoading && (
        <Reveal>
          <div
            data-testid="step8-empty-state"
            className="lg-glass"
            style={{
              marginBottom: 44,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              borderStyle: 'dashed',
              padding: '64px 0',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                marginBottom: 16,
                display: 'flex',
                height: 64,
                width: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                background: 'rgba(168,197,224,0.18)',
                color: C.ink,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 36, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>podcasts</span>
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>尚未生成直播策划方案</p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>填写上方表单，点击「生成直播方案」开始生成</p>
          </div>
        </Reveal>
      )}

      {/* ── 结果区 · 仅有真实数据时显示 ─────────────────── */}
      {hasResult && (
      <>

      {/* ── KPI 卡一排 ─────────────────────────────────────── */}
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, marginBottom: 44 }}>
        {/* 方案模块数 · 环形 · 冷蓝 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>library_books</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>全覆盖
              </span>
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                  6
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}> 模块</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>方案模块数</p>
              </div>
              <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }} role="img" aria-label="方案模块数覆盖 100%">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100 100" />
                </svg>
              </div>
            </div>
          </motion.div>
        </Item>

        {/* 开场话术 · 字数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.10)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>record_voice_over</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.10)', color: C.burgundyText }}>开场</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                {result.opening.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}> 字</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>开场话术字数</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
              {[45, 72, 60, 88, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: 'rgba(168,197,224,0.5)' }} />
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 产品话术 · 字数 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.15)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>inventory_2</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.15)', color: C.purpleText }}>产品</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                {result.product.length}
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}> 字</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>产品话术字数</p>
            </div>
            <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.15)' }}>
              <div
                style={{
                  height: 8,
                  width: '85%',
                  borderRadius: 9999,
                  background: C.grad,
                }}
              />
            </div>
          </motion.div>
        </Item>

        {/* 流程环节 */}
        <Item style={{ height: '100%' }}>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'flex',
                  height: 36,
                  width: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'rgba(168,197,224,0.22)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>view_timeline</span>
              </span>
              <span style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb }}>
                6 节
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow, margin: 0 }}>
                6
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)' }}> 环节</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>流程环节</p>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['开场', '暖场', '逼单'].map((k) => (
                <span
                  key={k}
                  style={{
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 500,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>

      {/* ── 6 模块话术详情 ──────────────────────────────────── */}
      <Reveal style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>article</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>直播方案</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· 6 模块完整脚本 · AI 个性化生成</span>
        </div>
      </Reveal>

      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 44 }}>
        {([
          { key: 'opening' as const, label: '开场 / 钩子话术', icon: 'record_voice_over', accent: 'green' as const, desc: '自我介绍 · 钩子设计 · 留人话术' },
          { key: 'warmup' as const, label: '暖场互动话术', icon: 'groups', accent: 'normal' as const, desc: '互动话题 · 福利点 · 氛围营造' },
          { key: 'product' as const, label: '产品介绍话术', icon: 'inventory_2', accent: 'orange' as const, desc: 'FABE 模型：特性 · 优势 · 利益 · 证明' },
          { key: 'conversion' as const, label: '转化促单话术', icon: 'shopping_cart', accent: 'red' as const, desc: '限时优惠 · 行动引导 · 合规不夸大' },
          { key: 'faq' as const, label: '常见问题处理', icon: 'live_help', accent: 'normal' as const, desc: '发货 · 质量 · 型号 等常见 Q&A' },
          { key: 'closing' as const, label: '收尾话术', icon: 'flag', accent: 'green' as const, desc: '总结价值 · 引导下次互动' },
        ] as Array<{ key: keyof Step8LivestreamResult; label: string; icon: string; accent: Step8StageDetail['accent']; desc: string }>).map(({ key, label, icon, accent, desc }, idx) => {
          const aColor = accentColor(accent);
          const aText = accentText(accent);
          const aBg = accentBg(accent);
          return (
            <Item key={key} style={{ height: '100%' }}>
              <motion.div
                className="lg-glass"
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ overflow: 'hidden', borderRadius: 18, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {/* 模块头 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `0.5px solid ${C.line}`,
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        display: 'flex',
                        height: 32,
                        width: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#fff',
                        background: 'linear-gradient(135deg, rgba(168,197,224,0.6), rgba(120,160,220,0.4))',
                        fontFamily: F.mono,
                        textShadow: C.textShadow,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{label}</h4>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>{desc}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 9999,
                        padding: '4px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        background: 'rgba(168,197,224,0.18)',
                        color: aColor,
                        fontFamily: F.mono,
                      }}
                    >
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>{icon}</span>
                      {result[key].length} 字
                    </span>
                    <motion.button
                      type="button"
                      aria-label={`复制${label}`}
                      onClick={() => handleCopySection(label, result[key])}
                      className="lg-glass"
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: F.cn,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>content_copy</span>
                      复制
                    </motion.button>
                  </div>
                </div>
                {/* 话术内容 */}
                <div style={{ padding: 20, flex: 1 }}>
                  <div
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      background: aBg,
                      border: `0.5px solid rgba(168,197,224,0.2)`,
                    }}
                  >
                    <p style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: aText, fontFamily: F.mono }}>
                      话术内容
                    </p>
                    <p style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.7, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>{result[key]}</p>
                  </div>
                </div>
              </motion.div>
            </Item>
          );
        })}
      </RevealGroup>

      {/* ── AI 优化 ───────────────────────────────────────────── */}
      <Reveal>
        <motion.div
          className="lg-glass"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18 }}
          style={{ marginBottom: 24, overflow: 'hidden', borderRadius: 20 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `0.5px solid ${C.line}`,
              padding: '16px 24px',
            }}
          >
            <span
              style={{
                display: 'flex',
                height: 36,
                width: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: 'rgba(168,197,224,0.22)',
                color: C.ikb,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>auto_fix_high</span>
            </span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>AI 智能优化</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>一键优化直播脚本 · 提升转化率</p>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ marginBottom: 16, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn }}>
              AI 将基于最新直播数据与转化模型，对当前方案的话术节奏、逼单时机、互动设计进行深度优化，提升整体转化率。
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  onClick={handleOptimize}
                  disabled={!canBulkActions}
                  aria-label="一键优化脚本"
                  className="lg-gradbtn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: F.cn,
                    cursor: !canBulkActions ? 'not-allowed' : 'pointer',
                    opacity: !canBulkActions ? 0.4 : 1,
                    border: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_awesome</span>
                  一键优化脚本
                </button>
              </Magnetic>
              <motion.button
                type="button"
                onClick={handleRegenerateAll}
                disabled={isLoading}
                className="lg-glass"
                whileHover={isLoading ? {} : { y: -2 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 14,
                  padding: '12px 20px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  color: C.ink,
                  fontFamily: F.cn,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.4 : 1,
                  border: 'none',
                  whiteSpace: 'nowrap',
                  textShadow: C.textShadow,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: C.ikb }}>refresh</span>
                重新生成方案
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Reveal>

      {/* ── 底部完成卡 · hasResult 门控 ──────────────────────── */}
      <Reveal>
        <div
          className="lg-glass"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 20,
            padding: 24,
            background: 'linear-gradient(135deg, rgba(168,197,224,0.22) 0%, rgba(120,160,220,0.14) 100%)',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -48,
              top: -48,
              height: 160,
              width: 160,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              filter: 'blur(32px)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 28,
                    width: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16, color: '#fff' }}>check_circle</span>
                </span>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0, textShadow: C.textShadow }}>直播策划已完成</p>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: F.cn, margin: 0 }}>恭喜完成全部流程！现在可以查看完整的 IP 方案汇总，开始执行直播计划。</p>
            </div>
            <motion.button
              type="button"
              onClick={handleViewIpPlan}
              aria-label="查看我的 IP 方案"
              className="lg-glass"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 14,
                padding: '12px 24px',
                fontSize: 13,
                fontWeight: 700,
                color: C.ikb,
                fontFamily: F.cn,
                cursor: 'pointer',
                border: 'none',
                whiteSpace: 'nowrap',
                textShadow: C.textShadow,
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>description</span>
              查看我的 IP 方案
            </motion.button>
          </div>
        </div>
      </Reveal>

      {/* ── 数据洞察(雷达 + 趋势)──────────────────────────── */}
      <Reveal style={{ marginTop: 32 }}>
        <div data-testid="step8-generate-output" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.ikb }}>insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: 'rgba(168,197,224,0.18)',
              color: C.ikb,
              fontFamily: F.mono,
            }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ikb }} />
            模型已就绪
          </span>
        </div>
      </Reveal>

      <RevealGroup style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
        {/* 直播转化力雷达 */}
        <Item>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.22)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>直播转化力雷达</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>六维模型评估 · 参考值</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    lineHeight: 1,
                    fontFamily: F.display,
                    margin: 0,
                    background: C.grad,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  83
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono, margin: 0 }}>综合分 · 参考</p>
              </div>
            </div>
            {(() => {
              const dims = RADAR_DIMS_S8;
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="直播转化力雷达图">
                  <defs>
                    <linearGradient id="s8-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor="rgba(168,197,224,0.10)" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#s8-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R * (d.value / 100));
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                  })}
                  {dims.map((d, i) => {
                    const [x, y] = pt(i, R + 16);
                    return (
                      <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.7)" fontSize="10.5" fontWeight="600">
                        {d.label}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {RADAR_DIMS_S8.map((d) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Item>

        {/* 直播节奏·在线人数曲线 */}
        <Item>
          <motion.div
            className="lg-glass lg-spec"
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            style={{ borderRadius: 20, padding: 24 }}
          >
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.10)',
                    color: C.ikb,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                </span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>直播节奏·在线人数曲线</h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>沿 7 环节的在线人数/情绪预估</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {['在线人数', '互动率', '转化'].map((t, i) => (
                  <span
                    key={t}
                    style={{
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: i === 0 ? C.ikb : 'rgba(255,255,255,0.08)',
                      color: i === 0 ? '#fff' : 'rgba(255,255,255,0.8)',
                      fontFamily: F.mono,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>350</p>
              <span
                style={{
                  marginBottom: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: 9999,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(168,197,224,0.18)',
                  color: C.ikb,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>+192%
              </span>
              <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>峰值在线人数</span>
            </div>
            {(() => {
              const data = TREND_DATA_S8;
              const W = 560;
              const H = 168;
              const padL = 6;
              const padR = 6;
              const padT = 12;
              const padB = 8;
              const innerW = W - padL - padR;
              const innerH = H - padT - padB;
              const max = 400;
              const x = (i: number) => padL + (innerW * i) / (data.length - 1);
              const y = (v: number) => padT + innerH * (1 - v / max);
              const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
              const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
              return (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="直播节奏在线人数曲线图">
                  <defs>
                    <linearGradient id="s8-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="s8-trendLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.ikb} />
                      <stop offset="55%" stopColor={C.accent3} />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area} fill="url(#s8-trendFill)" />
                  <path d={line} fill="none" stroke="url(#s8-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" />
                  ))}
                </svg>
              );
            })()}
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }}>
              {TREND_LABELS_S8.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </motion.div>
        </Item>
      </RevealGroup>
      </>
      )}
    </LiquidShell>
  );
}
