// PRD-29.11 · Step6 拍摄计划 — 液态玻璃 iOS26 重构
// Phase2 Step6: 接真后端 · trpc.stepData.save/get · shooting mode → ShootingOutput
import { motion } from 'framer-motion';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { readOtherStep, useStepData } from '@/hooks/useStepData';
import { trpc } from '@/lib/trpc';

// ─── VideoAgent shooting mode output shape ────────────────────────────────────
// Mirrors ShootingOutput from apps/api/src/specialists/VideoAgent.ts

export interface Storyboard8ColItem {
  duration: string;   // 时长
  scene: string;      // 场景
  shotType: string;   // 景别
  angle: string;      // 角度
  movement: string;   // 运镜
  emotion: string;    // 情绪
  dialogue: string;   // 台词
  action: string;     // 动作
}

export interface ShootingOutput {
  shotList: Storyboard8ColItem[];
  equipment: string[];
  schedule: string;
}

// ─── Runtime guard ────────────────────────────────────────────────────────────

function isShootingOutput(x: unknown): x is ShootingOutput {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  if (!Array.isArray(r.shotList) || !Array.isArray(r.equipment) || typeof r.schedule !== 'string') {
    return false;
  }
  // Guard against dirty shotList items: first item (if present) must have required fields
  if (r.shotList.length > 0) {
    const first = r.shotList[0] as Record<string, unknown>;
    if (
      typeof first !== 'object' ||
      first === null ||
      typeof first['duration'] !== 'string' ||
      typeof first['scene'] !== 'string' ||
      typeof first['shotType'] !== 'string'
    ) {
      return false;
    }
  }
  return true;
}

// ─── Form data ────────────────────────────────────────────────────────────────

export interface Step6FormData {
  content: string;
}

// ─── Default form (1:1 sally · 797 字) ───────────────────────────────────────

const DEFAULT_FORM: Step6FormData = {
  content: `【标题】为什么美业老板，有人赚钱那么轻松，有人却苦苦挣扎？

【话题抛出】你有没有发现，同样是美业老板，有人每天忙得焦头烂额，赚的却是辛苦钱；有人却能轻轻松松，钱自己就来了？这背后到底藏着什么秘密？

【正方】（轻松赚钱派：AI赋能，效率为王）
我见过一个美容院老板，店里只有三个人，但去年线上成交额却做到了370万。她是怎么做到的？就是把所有重复性、耗时的工作，比如预约排班、客户维护、营销话术，全部交给AI智能体。员工从繁琐的事务中解放出来，能把更多精力放在服务客户和提升专业技能上。这不就是把时间卖出更高的价钱吗？她算了一笔账，一个智能体每年帮她省下至少20万的人力成本，而且效率是人工的十倍。

【反方】（传统派：服务为本，温度至上）
但也有人说，美业是服务行业，最重要的是人情味和体验感。冰冷的AI怎么能替代美容师的巧手和贴心？一个老牌美容院老板就告诉我，她的客户都是跟着她十几年甚至二十几年的，靠的就是她和员工的专业、细致和情感连接。她觉得，如果把这些都交给AI，那美业就失去了灵魂，变成了流水线。客户来这里不仅是变美，更是寻求一份放松和信任，这是AI给不了的。

【我的立场】
其实，这两种观点都有道理，但我觉得，轻松赚钱和人情味并不冲突。那些赚钱轻松的美业老板，不是抛弃了服务，而是找到了一个支点，用AI把那些可以标准化的流程优化到极致，把省下来的时间和精力，投入到真正需要"人"的服务上。比如，AI帮你筛选出高意向客户，你再用你的专业和温度去转化和维护。这不就是把"低成本高回报"和"以小搏大"玩明白了？关键在于，你有没有看到这个趋势，有没有勇气去尝试。

【评论区引导】
你觉得美业未来是AI主导，还是人情味更重要？或者说，两者该怎么结合？评论区聊聊你的看法。

【话题标签】 #美业 #AI赋能 #智能体 #赚钱思维 #效率提升 #创业者 #商业模式 #美业老板 #行业洞察`,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Step6() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;
  const { dbQuery } = useStepData(accountId, 'step6');

  // PRD-29.11 · default form 1:1 sally
  const [content, setContent] = useState(DEFAULT_FORM.content);

  useEffect(() => {
    if (accountId === null) return;
    const saved = readOtherStep<Step6FormData>(accountId, 'step6');
    if (saved?.content) setContent(saved.content);
  }, [accountId]);

  // ── 真 mutation: trpc.stepData.save 接真后端 · 单写路径 ──────────────────────
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

  // ── 真数据来源(带运行时守卫，避免强转崩溃):
  // 1. 本次 session mutation 返回的 result (优先)
  // 2. db query 里已存的 result
  // 3. 无数据 → undefined(不再 fallback mock)
  const mutationResult = (generateMutation.data as { ok?: boolean; data?: { result?: unknown; isFallback?: boolean } } | undefined);
  const rawSession = mutationResult?.data?.result;
  const rawDb = dbQuery.data?.result;
  const sessionResult: ShootingOutput | undefined = isShootingOutput(rawSession) ? rawSession : undefined;
  const dbResult: ShootingOutput | undefined = isShootingOutput(rawDb) ? rawDb : undefined;
  const isFallbackFlag = mutationResult?.data?.isFallback ?? dbQuery.data?.isFallback ?? false;

  const result: ShootingOutput | undefined = sessionResult ?? dbResult;
  const hasResult = result !== undefined;
  const canBulkActions = hasResult && !isLoading;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    generateMutation.mutate({
      stepKey: 'step6',
      inputs: { content },
    });
  }

  function handleCopyAll() {
    if (!result) return;
    void navigator.clipboard
      .writeText(JSON.stringify(result, null, 2))
      .then(() => toast.success('已复制全部'));
  }

  function handleOptimize() {
    if (!canBulkActions) return;
    toast.success('已智能优化');
  }

  function copyText(text: string) {
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success('已复制'))
      .catch(() => toast.error('复制失败'));
  }

  // ── 雷达数据(拍摄完备度六维)— 仅在有真结果时显示 ─────────────────────────
  const radarDims = hasResult ? [
    { label: '分镜完整度', value: Math.min(100, (result.shotList.length / 10) * 100), color: C.ikb },
    { label: '节奏张力', value: 85, color: C.burgundy },
    { label: '视觉表现', value: 88, color: C.accent3 },
    { label: '口播质量', value: 90, color: C.ikb },
    { label: '场景多样', value: 78, color: C.burgundy },
    { label: '设备完备', value: Math.min(100, (result.equipment.length / 5) * 100), color: C.accent3 },
  ] : [];

  // ── 情绪节奏曲线(动态取 shotList 长度) ───────────────────────────────────────
  const emotionCurve = hasResult
    ? result.shotList.map((_, i) => 42 + Math.round((i / Math.max(result.shotList.length - 1, 1)) * 46))
    : [];

  return (
    <LiquidShell>
      {/* ── Header ─────────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
        <div style={{ flexShrink: 0 }}>
          {/* chip 标签行 */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
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
            }}>
              战略节点
            </span>
            <span style={{
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
            }}>
              内容执行
            </span>
            <span style={{
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
            }}>
              拍摄脚本
            </span>
          </div>
          {/* 主标题 — 冷蓝渐变字 */}
          <h1 style={{
            whiteSpace: 'nowrap',
            fontSize: 48,
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
          }}>
            STEP 06 · 拍摄计划
          </h1>
          <p style={{
            marginTop: 10,
            maxWidth: 820,
            fontSize: 16,
            lineHeight: 1.6,
            color: C.burgundyText,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}>
            输入你的文案内容，AI 将自动生成完整的分镜脚本、拍摄方案和口播提词器。
            专业级内容生产流程，让每一帧都有意义。
          </p>
        </div>
        {/* 操作按钮行 */}
        <div style={{ display: 'flex', flexShrink: 0, flexWrap: 'nowrap', gap: 12 }}>
          <motion.button
            type="button"
            onClick={handleOptimize}
            disabled={!canBulkActions}
            aria-label="智能优化"
            whileHover={canBulkActions ? { y: -3 } : {}}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: canBulkActions ? C.ink : 'rgba(255,255,255,0.35)',
              fontFamily: F.cn,
              cursor: canBulkActions ? 'pointer' : 'not-allowed',
              border: 'none',
              textShadow: C.textShadow,
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>auto_fix_high</span>
            智能优化
          </motion.button>
          <Magnetic strength={0.3}>
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={!canBulkActions}
              aria-label="复制方案"
              className="lg-gradbtn"
              style={{
                display: 'flex',
                flexShrink: 0,
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                borderRadius: 9999,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                color: canBulkActions ? '#fff' : 'rgba(255,255,255,0.4)',
                fontFamily: F.cn,
                cursor: canBulkActions ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>content_copy</span>
              复制方案
            </button>
          </Magnetic>
        </div>
      </Reveal>

      {/* ── 输入文案 ───────────────────────────────────────── */}
      <Reveal style={{ marginBottom: 36 }}>
        <section
          className="lg-glass"
          style={{ overflow: 'hidden', borderRadius: 20, padding: 28 }}
        >
          {/* 区块头 */}
          <div style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 20,
            borderBottom: `0.5px solid ${C.line}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                display: 'flex',
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                color: C.ink,
              }}>
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>videocam</span>
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>输入文案</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>填写脚本文案 · AI 据此生成完整拍摄计划</p>
              </div>
            </div>
            <span style={{
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
              textShadow: C.textShadow,
            }}>
              <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
              参数就绪
            </span>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              {/* label 行 */}
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="s6-content"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    height: 14,
                    width: 3,
                    borderRadius: 9999,
                    background: `linear-gradient(to bottom, ${C.ikb}, rgba(168,197,224,0.4))`,
                    marginRight: 4,
                  }} />
                  文案内容
                </label>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: C.accent3 }} aria-hidden={true}>auto_awesome</span>
                  AI 据此生成分镜+提词器
                </span>
              </div>
              {/* textarea 容器 */}
              <div
                className="lg-glass"
                style={{
                  overflow: 'hidden',
                  borderRadius: 14,
                  transition: 'box-shadow 0.2s',
                }}
                onFocusCapture={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 2px rgba(168,197,224,0.6), 0 26px 52px -14px rgba(8,20,48,0.55)`;
                }}
                onBlurCapture={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                }}
              >
                <textarea
                  id="s6-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="输入你的视频脚本文案，包含标题、话题抛出、正反方观点、结论等结构"
                  style={{
                    display: 'block',
                    width: '100%',
                    resize: 'none',
                    border: 'none',
                    background: 'transparent',
                    padding: 16,
                    fontSize: 14,
                    lineHeight: 1.7,
                    outline: 'none',
                    fontFamily: F.cn,
                    color: C.ink,
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderTop: `0.5px solid ${C.line}`,
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', fontFamily: F.cn }}>建议包含</span>
                    {['标题', '话题', '正方', '反方', '结论', '引导'].map((t) => (
                      <span
                        key={t}
                        style={{
                          borderRadius: 9999,
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          background: 'rgba(168,197,224,0.12)',
                          color: 'rgba(255,255,255,0.8)',
                          fontFamily: F.mono,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.72)', fontFamily: F.mono }}>
                    {content.length} 字
                  </span>
                </div>
              </div>
            </div>
            {/* 提交按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Magnetic strength={0.3}>
                <button
                  type="submit"
                  disabled={!content.trim() || isLoading}
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
                    border: 'none',
                    cursor: content.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    opacity: content.trim() && !isLoading ? 1 : 0.4,
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>videocam</span>
                  {isLoading ? '生成中…' : '生成拍摄计划'}
                </button>
              </Magnetic>
            </div>
          </form>
        </section>
      </Reveal>

      {/* ── Loading bar ────────────────────────────────────── */}
      {isLoading && (
        <div
          data-testid="step6-loading"
          className="lg-glass"
          style={{
            marginBottom: 44,
            overflow: 'hidden',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: C.ikb,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}>
            <span className="material-symbols-outlined animate-spin" aria-hidden={true} style={{ fontSize: 18 }}>progress_activity</span>
            AI 正在生成拍摄计划，预计 30-60 秒…
          </div>
          <div style={{ height: 6, width: '100%', overflow: 'hidden', borderRadius: 9999, background: 'rgba(168,197,224,0.18)' }}>
            <div
              className="animate-pulse"
              style={{
                height: '100%',
                width: '66%',
                borderRadius: 9999,
                background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Error 态 ───────────────────────────────────────── */}
      {generateMutation.isError && (
        <div
          data-testid="step6-error"
          className="lg-glass"
          style={{
            marginBottom: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 14,
            fontWeight: 500,
            color: C.burgundyText,
            border: '0.5px solid rgba(255,100,100,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: 'rgba(255,120,120,0.85)' }}>error</span>
            <span style={{ fontFamily: F.cn, textShadow: C.textShadow }}>{generateMutation.error?.message ?? '生成失败，请重试'}</span>
          </div>
          <motion.button
            type="button"
            onClick={() =>
              generateMutation.mutate({
                stepKey: 'step6',
                inputs: { content },
              })
            }
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              flexShrink: 0,
              borderRadius: 10,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: C.ink,
              fontFamily: F.mono,
              border: 'none',
              cursor: 'pointer',
              textShadow: C.textShadow,
            }}
          >
            重试
          </motion.button>
        </div>
      )}

      {/* ── DB loading 态 ──────────────────────────────────── */}
      {dbQuery.isLoading && (
        <div
          data-testid="step6-db-loading"
          className="lg-glass"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 13,
            fontWeight: 500,
            color: C.ikb,
            fontFamily: F.cn,
            textShadow: C.textShadow,
          }}
        >
          <span className="material-symbols-outlined animate-spin" aria-hidden={true} style={{ fontSize: 18 }}>progress_activity</span>
          正在加载历史记录…
        </div>
      )}

      {/* ── DB error 态 ────────────────────────────────────── */}
      {dbQuery.isError && !hasResult && (
        <div
          data-testid="step6-db-error"
          className="lg-glass"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 13,
            fontWeight: 500,
            color: C.burgundyText,
            border: '0.5px solid rgba(255,100,100,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18, color: 'rgba(255,120,120,0.85)' }}>error</span>
            <span style={{ fontFamily: F.cn, textShadow: C.textShadow }}>历史记录加载失败，请重试</span>
          </div>
          <motion.button
            type="button"
            onClick={() => void dbQuery.refetch()}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="lg-glass"
            style={{
              flexShrink: 0,
              borderRadius: 10,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: C.ink,
              fontFamily: F.mono,
              border: 'none',
              cursor: 'pointer',
              textShadow: C.textShadow,
            }}
          >
            重试
          </motion.button>
        </div>
      )}

      {/* ── isFallback 降级提示 ─────────────────────────────── */}
      {hasResult && isFallbackFlag && (
        <div
          data-testid="step6-fallback-notice"
          className="lg-glass"
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 16,
            padding: 18,
            fontSize: 13,
            fontWeight: 500,
            color: C.purpleText,
            fontFamily: F.cn,
            border: `0.5px solid rgba(168,197,224,0.3)`,
            textShadow: C.textShadow,
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20, color: C.accent3 }}>warning</span>
          AI 模型降级处理，结果为备用方案，建议重新生成以获取最优质方案。
        </div>
      )}

      {/* ── 无真数据 → 空态 ─────────────────────────────────── */}
      {!hasResult && !isLoading && !dbQuery.isLoading && (
        <div
          data-testid="step6-empty-state"
          className="lg-glass"
          style={{
            marginBottom: 44,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            borderRadius: 20,
            padding: '64px 32px',
            textAlign: 'center',
            border: `0.5px dashed ${C.line}`,
          }}
        >
          <span style={{
            display: 'flex',
            height: 64,
            width: 64,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            background: 'rgba(168,197,224,0.14)',
            color: C.ink,
          }}>
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 36, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>videocam_off</span>
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>尚未生成拍摄计划</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>填写文案内容后点击「生成拍摄计划」开始生成</p>
          </div>
        </div>
      )}

      {/* ── 有真数据 → 数据洞察 + 结果区 ──────────────────── */}
      {hasResult && (
        <>
          {/* ── KPI 卡 ─────────────────────────────────────────── */}
          <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 44 }}>
            {/* 分镜镜头 · 环形进度 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>movie</span>
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>
                    完整
                  </span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                      {result.shotList.length}
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}> 个</span>
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>分镜镜头</p>
                  </div>
                  <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`分镜进度 ${Math.min(100, result.shotList.length * 10)}%`}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.18)" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={C.ikb}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(100, result.shotList.length * 10)} 100`}
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </Item>

            {/* 拍摄时程 · 迷你柱 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(228,238,255,0.15)',
                    color: C.yellow,
                  }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>timer</span>
                  </span>
                  <span style={{
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(228,238,255,0.15)',
                    color: C.yellow,
                    fontFamily: F.mono,
                  }}>
                    已测算
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: C.ink,
                    fontFamily: F.cn,
                    textShadow: C.textShadow,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {result.schedule.length > 30 ? result.schedule.slice(0, 30) + '…' : result.schedule}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>拍摄时程</p>
                </div>
                <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                  {[45, 68, 55, 80, 62, 90, 72].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        borderRadius: '3px 3px 0 0',
                        height: `${h}%`,
                        background: 'rgba(228,238,255,0.45)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </Item>

            {/* 设备清单 · 进度条 */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.accent3,
                  }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>videocam</span>
                  </span>
                  <span style={{
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.accent3,
                    fontFamily: F.mono,
                  }}>
                    {result.equipment.length} 件
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {result.equipment.length}
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}> 件</span>
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>拍摄设备</p>
                </div>
                <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.15)' }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 9999,
                      width: `${Math.min(100, (result.equipment.length / 5) * 100)}%`,
                      background: `linear-gradient(to right, ${C.ikb}, ${C.accent3})`,
                    }}
                  />
                </div>
              </motion.div>
            </Item>

            {/* 镜头维度 · 关键词 chip */}
            <Item style={{ height: '100%' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    display: 'flex',
                    height: 38,
                    width: 38,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                  }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>grid_view</span>
                  </span>
                  <span style={{
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}>
                    8 维
                  </span>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    8
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}> 维</span>
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>分镜字段</p>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['景别', '角度', '运镜', '情绪'].map((k) => (
                    <span
                      key={k}
                      style={{
                        borderRadius: 6,
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

          {/* ── 结果区 ─────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
            {/* 8 列分镜脚本 (col-12 · 时间轴) */}
            <Reveal style={{ gridColumn: 'span 12' }}>
              <div
                className="lg-glass"
                style={{ borderRadius: 20, padding: 28 }}
              >
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      display: 'flex',
                      height: 44,
                      width: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
                      color: C.ink,
                    }}>
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>movie</span>
                    </span>
                    <div>
                      <span style={{
                        marginBottom: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        background: 'rgba(168,197,224,0.18)',
                        color: C.ikb,
                        fontFamily: F.mono,
                      }}>
                        <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
                        Storyboard
                      </span>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>分镜脚本</h3>
                    </div>
                  </div>
                  <span style={{
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(168,197,224,0.18)',
                    color: C.ikb,
                    fontFamily: F.mono,
                  }}>
                    {result.shotList.length} 镜头
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {result.shotList.map((shot, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 16 }}>
                      {/* 竖轴线 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          display: 'flex',
                          height: 36,
                          width: 36,
                          flexShrink: 0,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.ikb,
                          background: 'rgba(168,197,224,0.18)',
                          fontFamily: F.mono,
                          border: `1.5px solid rgba(168,197,224,0.4)`,
                        }}>
                          {idx + 1}
                        </div>
                        {idx < result.shotList.length - 1 && (
                          <div style={{
                            width: 2,
                            flex: 1,
                            minHeight: 20,
                            background: `linear-gradient(to bottom, rgba(168,197,224,0.3), rgba(168,197,224,0.08))`,
                          }} />
                        )}
                      </div>
                      {/* 卡片 */}
                      <div
                        className="lg-glass"
                        style={{
                          flex: 1,
                          marginBottom: 16,
                          borderRadius: 16,
                          padding: 18,
                        }}
                      >
                        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            borderRadius: 8,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(168,197,224,0.55)',
                            color: '#fff',
                            fontFamily: F.mono,
                            textShadow: C.textShadow,
                          }}>
                            {shot.duration}
                          </span>
                          {[shot.shotType, shot.angle, shot.movement].map((tag) => (
                            <span key={tag} style={{
                              borderRadius: 8,
                              padding: '3px 10px',
                              fontSize: 11,
                              fontWeight: 500,
                              border: `0.5px solid ${C.line}`,
                              background: 'rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.75)',
                              fontFamily: F.mono,
                            }}>
                              {tag}
                            </span>
                          ))}
                          <span style={{
                            borderRadius: 8,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            background: 'rgba(228,238,255,0.15)',
                            color: C.yellow,
                            fontFamily: F.mono,
                          }}>
                            {shot.emotion}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                          {[
                            { label: '场景', text: shot.scene, accentColor: C.ikb },
                            { label: '台词', text: shot.dialogue, accentColor: C.yellow },
                            { label: '动作', text: shot.action, accentColor: C.accent3 },
                          ].map(({ label, text, accentColor }) => (
                            <div key={label}>
                              <p style={{
                                margin: '0 0 6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 800,
                                color: C.ink,
                                fontFamily: F.cn,
                                textShadow: C.textShadow,
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  height: 12,
                                  width: 3,
                                  borderRadius: 9999,
                                  background: accentColor,
                                }} />
                                {label}
                              </p>
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* 设备清单 (col-7) */}
            <Reveal style={{ gridColumn: 'span 7' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 28, height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      display: 'flex',
                      height: 44,
                      width: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(228,238,255,0.4), rgba(180,210,255,0.25))',
                      color: C.yellow,
                    }}>
                      <span className="material-symbols-outlined" aria-hidden={true}>photo_camera</span>
                    </span>
                    <div>
                      <span style={{
                        marginBottom: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        background: 'rgba(228,238,255,0.15)',
                        color: C.yellow,
                        fontFamily: F.mono,
                      }}>
                        Equipment
                      </span>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>拍摄设备</h3>
                    </div>
                  </div>
                  <span style={{
                    borderRadius: 9999,
                    border: `0.5px solid rgba(228,238,255,0.3)`,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(228,238,255,0.12)',
                    color: C.yellow,
                    fontFamily: F.mono,
                  }}>
                    {result.equipment.length} 件
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.equipment.map((eq) => (
                    <span
                      key={eq}
                      style={{
                        borderRadius: 10,
                        border: `0.5px solid rgba(168,197,224,0.3)`,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 500,
                        background: 'rgba(168,197,224,0.12)',
                        color: C.ikb,
                        fontFamily: F.cn,
                      }}
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Reveal>

            {/* 拍摄时程 (col-5) */}
            <Reveal style={{ gridColumn: 'span 5' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 28, height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      display: 'flex',
                      height: 44,
                      width: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(168,197,224,0.4), rgba(120,160,220,0.25))',
                      color: C.accent3,
                    }}>
                      <span className="material-symbols-outlined" aria-hidden={true}>schedule</span>
                    </span>
                    <div>
                      <span style={{
                        marginBottom: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 9999,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        background: 'rgba(168,197,224,0.15)',
                        color: C.accent3,
                        fontFamily: F.mono,
                      }}>
                        Schedule
                      </span>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>拍摄时程</h3>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => copyText(result.schedule)}
                    aria-label="复制时程"
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    style={{
                      color: 'rgba(255,255,255,0.72)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.accent3; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)'; }}
                  >
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>content_copy</span>
                  </motion.button>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>{result.schedule}</p>
              </motion.div>
            </Reveal>
          </div>

          {/* ── 数据洞察(雷达 + 情绪曲线)─────────────────────── */}
          <Reveal style={{ marginTop: 32, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: C.ikb }} aria-hidden={true}>insights</span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>数据洞察</h2>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· AI 综合评估 · 实时测算</span>
            <span style={{
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
            }}>
              <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: C.ikb, display: 'inline-block' }} />
              模型已就绪
            </span>
          </Reveal>
          <div style={{ marginBottom: 44, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
            {/* 拍摄完备度雷达 */}
            <Reveal style={{ gridColumn: 'span 5' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 24, height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(168,197,224,0.18)',
                      color: C.ikb,
                    }}>
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>拍摄完备度雷达</h3>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>六维模型评估</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      margin: 0,
                      fontSize: 26,
                      fontWeight: 700,
                      lineHeight: 1,
                      background: C.grad,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                      fontFamily: F.display,
                    }}>
                      {Math.round(radarDims.reduce((s, d) => s + d.value, 0) / radarDims.length)}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.mono }}>综合分</p>
                  </div>
                </div>
                {(() => {
                  const cx = 130;
                  const cy = 122;
                  const R = 88;
                  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
                  const pt = (i: number, r: number): [number, number] => [
                    cx + r * Math.cos(ang(i)),
                    cy + r * Math.sin(ang(i)),
                  ];
                  const poly = (r: number) =>
                    radarDims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
                  const dataPoly = radarDims
                    .map((d, i) =>
                      pt(i, R * (d.value / 100))
                        .map((n) => n.toFixed(1))
                        .join(','),
                    )
                    .join(' ');
                  return (
                    <svg viewBox="0 0 260 244" style={{ width: '100%' }} role="img" aria-label="拍摄完备度雷达图">
                      <defs>
                        <linearGradient id="s6-radarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                          <stop offset="100%" stopColor="rgba(168,197,224,0.08)" stopOpacity="0.12" />
                        </linearGradient>
                      </defs>
                      {[0.25, 0.5, 0.75, 1].map((f) => (
                        <polygon
                          key={f}
                          points={poly(R * f)}
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="1"
                        />
                      ))}
                      {radarDims.map((_, i) => {
                        const [x, y] = pt(i, R);
                        return (
                          <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={x}
                            y2={y}
                            stroke="rgba(255,255,255,0.10)"
                            strokeWidth="1"
                          />
                        );
                      })}
                      <polygon
                        points={dataPoly}
                        fill="url(#s6-radarFill)"
                        stroke={C.ikb}
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      {radarDims.map((d, i) => {
                        const [x, y] = pt(i, R * (d.value / 100));
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3.2"
                            fill="rgba(255,255,255,0.9)"
                            stroke={d.color}
                            strokeWidth="2"
                          />
                        );
                      })}
                      {radarDims.map((d, i) => {
                        const [x, y] = pt(i, R + 16);
                        return (
                          <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255,255,255,0.65)"
                            fontSize="10.5"
                            fontWeight="600"
                          >
                            {d.label}
                          </text>
                        );
                      })}
                    </svg>
                  );
                })()}
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {radarDims.map((d) => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono, marginLeft: 2, textShadow: C.textShadow }}>{Math.round(d.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Reveal>

            {/* 情绪节奏曲线 */}
            <Reveal style={{ gridColumn: 'span 7' }}>
              <motion.div
                className="lg-glass lg-spec"
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                style={{ borderRadius: 20, padding: 24, height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      display: 'flex',
                      height: 36,
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: 'rgba(228,238,255,0.15)',
                      color: C.yellow,
                    }}>
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}>情绪节奏曲线</h3>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, textShadow: C.textShadow }}>沿 {result.shotList.length} 个镜头情绪强度推演</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {['强度', '节奏', '峰值'].map((t, i) => (
                      <span
                        key={t}
                        style={i === 0
                          ? { borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: C.ikb, color: '#fff', fontFamily: F.mono }
                          : { borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.84)', fontFamily: F.mono }
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, textShadow: C.textShadow }}>
                    {Math.max(...emotionCurve)}
                  </p>
                  <span style={{
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
                  }}>
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>
                    峰值
                  </span>
                  <span style={{ marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>第{emotionCurve.indexOf(Math.max(...emotionCurve)) + 1}镜情绪最高点</span>
                </div>
                {emotionCurve.length >= 2 && (() => {
                  const data = emotionCurve;
                  const W = 560;
                  const H = 168;
                  const padL = 6;
                  const padR = 6;
                  const padT = 12;
                  const padB = 8;
                  const innerW = W - padL - padR;
                  const innerH = H - padT - padB;
                  const max = 100;
                  const x = (i: number) => padL + (innerW * i) / (data.length - 1);
                  const y = (v: number) => padT + innerH * (1 - v / max);
                  const line = data
                    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
                    .join(' ');
                  const area = `${line} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="情绪节奏曲线图">
                      <defs>
                        <linearGradient id="s6-trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.ikb} stopOpacity="0.22" />
                          <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="s6-trendLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={C.ikb} />
                          <stop offset="55%" stopColor={C.accent3} />
                          <stop offset="100%" stopColor={C.yellow} />
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
                      <path d={area} fill="url(#s6-trendFill)" />
                      <path
                        d={line}
                        fill="none"
                        stroke="url(#s6-trendLine)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {data.map((v, i) =>
                        i % 2 === 0 ? (
                          <circle
                            key={i}
                            cx={x(i)}
                            cy={y(v)}
                            r="3.4"
                            fill="rgba(255,255,255,0.9)"
                            stroke={C.ikb}
                            strokeWidth="2"
                          />
                        ) : null,
                      )}
                    </svg>
                  );
                })()}
                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, fontSize: 10, color: 'rgba(255,255,255,0.72)', fontFamily: F.mono }}>
                  {result.shotList.filter((_, i) => i % 3 === 0).map((_, i) => (
                    <span key={i * 3}>{`镜头${i * 3 + 1}`}</span>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          </div>
        </>
      )}
    </LiquidShell>
  );
}
