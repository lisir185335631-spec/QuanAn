/**
 * DeepLearningTabs.tsx — PRD-15 US-003 · iOS26 液态玻璃皮
 * 3 tabs: 学习 / 我的库 / 公式应用
 * AC-2/3/4: tab content components used by DeepLearning.tsx
 * 逻辑/testid 零回退 · 只换视觉皮
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { C, F } from '@/components/home-next/ikb/system';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ParseAnalysis {
  coreFormula: string;
  hookType: string;
  structurePattern: string;
  emotionalArc: string;
  keywords: string[];
}

export interface QueueItem {
  id: number;
  sample: string;
  sourcePlatform: string;
  coreFormula: string;
  status: string;
  createdAt: Date | string;
}

// ── Platform options ───────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'douyin', label: '抖音' },
  { value: 'weixin', label: '微信公众号' },
  { value: 'bilibili', label: 'B站' },
  { value: 'weibo', label: '微博' },
  { value: 'other', label: '其他' },
] as const;

// ── Tab 1: 学习 ───────────────────────────────────────────────────────────────

interface LearnTabProps {
  onSaved: () => void;
  onApply: (analysis: ParseAnalysis, queueId: number) => void;
}

export function LearnTab({ onSaved, onApply }: LearnTabProps) {
  const [sample, setSample] = useState('');
  const [platform, setPlatform] = useState('xiaohongshu');
  const [analysis, setAnalysis] = useState<ParseAnalysis | null>(null);
  const [savedQueueId, setSavedQueueId] = useState<number | null>(null);

  const parseMutation = trpc.deepLearning.parse.useMutation({
    onSuccess(data) {
      setAnalysis(data.analysis);
      setSavedQueueId(data.queueId);
    },
    onError(err) {
      toast.error(`解析失败: ${err.message}`);
    },
  });

  function handleSubmit() {
    if (sample.length < 100) {
      toast.error('文案不少于 100 字');
      return;
    }
    parseMutation.mutate({ sample, sourcePlatform: platform });
  }

  function handleSaveToLibrary() {
    if (!analysis) return;
    onSaved();
    toast.success('已保存到我的库');
  }

  function handleApply() {
    if (!analysis || savedQueueId === null || savedQueueId === undefined) return;
    onApply(analysis, savedQueueId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }} data-testid="learn-tab">
      {/* 来源平台 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>来源平台</label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger
            className="w-48"
            data-testid="platform-select"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `0.5px solid rgba(255,255,255,0.18)`,
              color: C.ink,
              borderRadius: 10,
              fontFamily: F.cn,
            }}
          >
            <SelectValue placeholder="选择平台" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* textarea */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="dlt-sample" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>
          粘贴优秀文案（≥100 字）
        </label>
        <div
          style={{
            overflow: 'hidden',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: `0.5px solid rgba(255,255,255,0.18)`,
          }}
        >
          <textarea
            id="dlt-sample"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder="粘贴您想学习的文案内容…"
            rows={8}
            style={{
              width: '100%',
              resize: 'none',
              border: 'none',
              background: 'transparent',
              padding: 16,
              fontSize: 14,
              lineHeight: 1.6,
              outline: 'none',
              color: C.ink,
              fontFamily: F.cn,
              boxSizing: 'border-box',
            }}
            data-testid="sample-textarea"
          />
          <div style={{ padding: '8px 16px', borderTop: `0.5px solid rgba(255,255,255,0.12)`, fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: F.mono }}>
            {sample.length} 字
          </div>
        </div>
      </div>

      {/* 提交按钮 */}
      <motion.button
        onClick={handleSubmit}
        disabled={parseMutation.isPending || sample.length < 100}
        data-testid="parse-submit-btn"
        whileHover={parseMutation.isPending || sample.length < 100 ? {} : { y: -3 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: F.cn,
          cursor: parseMutation.isPending || sample.length < 100 ? 'not-allowed' : 'pointer',
          opacity: parseMutation.isPending || sample.length < 100 ? 0.4 : 1,
          background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.35))',
          border: `0.5px solid rgba(168,197,224,0.55)`,
          color: C.ink,
          textShadow: C.textShadow,
          transition: 'opacity 0.2s',
        }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>school</span>
        {parseMutation.isPending ? '解析中…' : '开始深度解析'}
      </motion.button>

      {/* 解析结果 */}
      {analysis && (
        <div
          className="lg-glass"
          data-testid="parse-result"
          style={{ borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}
          >
            解析结果
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, margin: '0 0 4px' }}>核心公式</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }} data-testid="core-formula">
                {analysis.coreFormula}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, margin: '0 0 4px' }}>钩子类型</p>
              <p style={{ fontSize: 13, color: C.ink, fontFamily: F.cn, margin: 0 }} data-testid="hook-type">
                {analysis.hookType}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, margin: '0 0 4px' }}>结构模式</p>
              <p style={{ fontSize: 13, color: C.ink, fontFamily: F.cn, margin: 0 }} data-testid="structure-pattern">
                {analysis.structurePattern}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, margin: '0 0 4px' }}>情绪弧线</p>
              <p style={{ fontSize: 13, color: C.ink, fontFamily: F.cn, margin: 0 }} data-testid="emotional-arc">
                {analysis.emotionalArc}
              </p>
            </div>
          </div>
          {analysis.keywords.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: F.mono, margin: '0 0 4px' }}>关键词</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} data-testid="keywords-list">
                {analysis.keywords.map((kw, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 6,
                      background: 'rgba(168,197,224,0.18)',
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: C.ikb,
                      fontFamily: F.cn,
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
            <button
              onClick={handleSaveToLibrary}
              data-testid="save-to-library-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: F.cn,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.35))',
                border: `0.5px solid rgba(168,197,224,0.55)`,
                color: C.ink,
                textShadow: C.textShadow,
                transition: 'opacity 0.2s',
              }}
            >
              保存到我的库
            </button>
            <button
              onClick={handleApply}
              data-testid="apply-to-copywriting-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: F.cn,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                border: `0.5px solid rgba(255,255,255,0.18)`,
                color: 'rgba(255,255,255,0.8)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            >
              应用到文案生成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: 我的库 ─────────────────────────────────────────────────────────────

interface LibraryTabProps {
  onApply: (item: QueueItem) => void;
}

export function LibraryTab({ onApply }: LibraryTabProps) {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.deepLearning.list.useQuery({
    limit: 20,
    offset: 0,
    onlyActive: true,
  });

  const deleteMutation = trpc.deepLearning.delete.useMutation({
    onSuccess() {
      void utils.deepLearning.list.invalidate();
      toast.success('已删除');
    },
    onError(err) {
      toast.error(`删除失败: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <p
        style={{ padding: '32px 0', textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn }}
        data-testid="library-loading"
      >
        加载中…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }} data-testid="library-empty">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: F.cn, margin: 0 }}>暂无学习记录</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: F.cn, margin: '4px 0 0' }}>
          在「学习」标签页提交文案后，记录将出现在这里
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh]" data-testid="library-table">
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `0.5px solid rgba(255,255,255,0.14)`, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: F.mono }}>
            <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600, width: '40%' }}>文案摘要</th>
            <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600 }}>公式名</th>
            <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600 }}>平台</th>
            <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600 }}>学习时间</th>
            <th style={{ paddingBottom: 8, textAlign: 'left', fontWeight: 600 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {(items as QueueItem[]).map((item) => (
            <motion.tr
              key={item.id}
              style={{ borderBottom: `0.5px solid rgba(255,255,255,0.08)`, cursor: 'default' }}
              data-testid={`library-row-${item.id}`}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              transition={{ duration: 0.15 }}
            >
              <td style={{ padding: '10px 16px 10px 0', color: 'rgba(255,255,255,0.85)', fontFamily: F.cn }}>
                {item.sample.slice(0, 80)}
                {item.sample.length > 80 ? '…' : ''}
              </td>
              <td style={{ padding: '10px 16px 10px 0', color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{item.coreFormula}</td>
              <td style={{ padding: '10px 16px 10px 0', color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>{item.sourcePlatform}</td>
              <td style={{ padding: '10px 16px 10px 0', color: 'rgba(255,255,255,0.6)', fontFamily: F.cn }}>
                {new Date(item.createdAt).toLocaleDateString('zh-CN')}
              </td>
              <td style={{ padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ fontSize: 12, color: C.ikb, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.cn, padding: 0 }}
                    onClick={() => onApply(item)}
                    data-testid={`apply-btn-${item.id}`}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
                  >
                    应用
                  </button>
                  <button
                    style={{ fontSize: 12, color: 'rgba(255,120,120,0.85)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.cn, padding: 0, opacity: deleteMutation.isPending ? 0.5 : 1 }}
                    onClick={() => deleteMutation.mutate({ archiveId: item.id })}
                    data-testid={`delete-btn-${item.id}`}
                    disabled={deleteMutation.isPending}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
                  >
                    删除
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

// ── Tab 3: 公式应用 ───────────────────────────────────────────────────────────

interface ApplyFormulaTabProps {
  preselectedQueueId?: number | null;
}

export function ApplyFormulaTab({ preselectedQueueId }: ApplyFormulaTabProps) {
  const { data: items = [] } = trpc.deepLearning.list.useQuery({
    limit: 50,
    offset: 0,
    onlyActive: true,
  });

  const [selectedQueueId, setSelectedQueueId] = useState<string>(
    preselectedQueueId !== null && preselectedQueueId !== undefined ? String(preselectedQueueId) : '',
  );
  const [newTopic, setNewTopic] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const applyMutation = trpc.deepLearning.applyFormula.useMutation({
    onSuccess(data) {
      setResult(data.content);
    },
    onError(err) {
      toast.error(`生成失败: ${err.message}`);
    },
  });

  function handleGenerate() {
    if (!selectedQueueId) {
      toast.error('请先选择公式');
      return;
    }
    if (!newTopic.trim()) {
      toast.error('请输入新主题');
      return;
    }
    applyMutation.mutate({ queueId: parseInt(selectedQueueId, 10), newTopic });
  }

  const isDisabled = applyMutation.isPending || !selectedQueueId || !newTopic.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }} data-testid="apply-formula-tab">
      {/* 选择公式 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>选择公式</label>
        {(items as QueueItem[]).length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: F.cn, margin: 0 }}>暂无学习记录，请先在「学习」标签提交文案</p>
        ) : (
          <Select
            value={selectedQueueId}
            onValueChange={setSelectedQueueId}
          >
            <SelectTrigger
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: `0.5px solid rgba(255,255,255,0.18)`,
                color: C.ink,
                borderRadius: 10,
                fontFamily: F.cn,
                width: '100%',
              }}
              data-testid="formula-select"
            >
              <SelectValue placeholder="从我的库中选择公式…" />
            </SelectTrigger>
            <SelectContent>
              {(items as QueueItem[]).map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.coreFormula} · {item.sourcePlatform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 新主题 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="dlt-new-topic" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}>新主题</label>
        <input
          id="dlt-new-topic"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="输入您想要创作的主题…"
          style={{
            width: '100%',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 14,
            outline: 'none',
            background: 'rgba(255,255,255,0.08)',
            border: `0.5px solid rgba(255,255,255,0.18)`,
            color: C.ink,
            fontFamily: F.cn,
            boxSizing: 'border-box',
          }}
          data-testid="new-topic-input"
        />
      </div>

      {/* 生成按钮 */}
      <motion.button
        onClick={handleGenerate}
        disabled={isDisabled}
        data-testid="generate-btn"
        whileHover={isDisabled ? {} : { y: -3 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        style={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: F.cn,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.4 : 1,
          background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.35))',
          border: `0.5px solid rgba(168,197,224,0.55)`,
          color: C.ink,
          textShadow: C.textShadow,
          transition: 'opacity 0.2s',
        }}
      >
        <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>auto_awesome</span>
        {applyMutation.isPending ? '生成中…' : '用公式生成文案'}
      </motion.button>

      {/* 生成结果 */}
      {result && (
        <div
          className="lg-glass"
          data-testid="formula-result"
          style={{ borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <span
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ikb, fontFamily: F.mono, textShadow: C.textShadow }}
          >
            生成结果
          </span>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, whiteSpace: 'pre-wrap', margin: 0 }}>{result}</p>
        </div>
      )}
    </div>
  );
}
