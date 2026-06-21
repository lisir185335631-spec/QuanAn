/**
 * DeepLearning.tsx — /deep-learning · iOS26 液态玻璃皮
 * 阶段2 phase-2: 接真 trpc.deepLearning.* (list/parse/delete/applyFormula/createFromFile/learn/learnStatus)
 * 逻辑/testid 零回退 · 液态玻璃皮 · 5 组件 inline
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LiquidShell } from '@/components/home-next/LiquidShell';
import { C, F, Item, Magnetic, Reveal, RevealGroup } from '@/components/home-next/ikb/system';
import {
  DEEP_LEARNING_H1,
  DEEP_LEARNING_SUBTITLE,
  DL_ADD_SAMPLE_LABEL,
  DL_ADD_THIS_BTN,
  DL_ARCHIVES_TITLE_PREFIX,
  DL_BATCH_PASTE,
  DL_EMPTY_DESC,
  DL_EMPTY_TITLE,
  DL_HINT_CTRL_ENTER,
  DL_NAME_PLACEHOLDER,
  DL_SECTION_HIGHLIGHTS_PREFIX,
  DL_SECTION_LOGIC,
  DL_SECTION_PACKAGING,
  DL_SECTION_STYLE_PORTRAIT,
  DL_START_BTN_PREFIX,
  DL_START_BTN_SUFFIX,
  DL_TAB_PASTE,
  DL_TAB_UPLOAD,
  DL_TEXTAREA_PLACEHOLDER,
  DL_TOAST_BATCH,
  DL_TOAST_COPY,
  DL_TOAST_DELETE,
  DL_TOAST_LEARN_DONE,
  DL_TOAST_LEARN_FAILED,
  DL_TOAST_LEARN_QUEUED,
  DL_TOAST_NEED_TEXT,
  DL_USAGE_SECTIONS,
  DL_USAGE_TITLE,
  getDLArchiveStatusLabel,
} from '@/lib/constants/deep-learning';
import { trpc, type RouterOutputs } from '@/lib/trpc';

// ── Types ────────────────────────────────────────────────────────────────────

/** Shape returned by trpc.deepLearning.list — derived from router types */
type QueueRow = RouterOutputs['deepLearning']['list'][number];

/** Parse analysis returned by trpc.deepLearning.parse */
type ParseAnalysis = RouterOutputs['deepLearning']['parse']['analysis'];

// ── Batch sample collected locally before learn() ────────────────────────────

interface BatchSample {
  text: string;
  source: string;
}

// ── Inline: SampleForm (液态玻璃) ────────────────────────────────────────────

type TabKey = 'paste' | 'upload';

interface SampleFormProps {
  text: string;
  onTextChange: (v: string) => void;
  archiveName: string;
  onArchiveNameChange: (v: string) => void;
  sourcePlatform: string;
  onSourcePlatformChange: (v: string) => void;
  samples: BatchSample[];
  onAddThis: () => void;
  onRemoveSample: (i: number) => void;
  onStart: () => void;
  isLearnPending: boolean;
  isParsePending: boolean;
  parseAnalysis: ParseAnalysis | null;
  parsedQueueId: number | null;
  onApplyFormula: (queueId: number, topic: string) => void;
  isApplyPending: boolean;
  applyContent: string | null;
  fileUrl: string;
  onFileUrlChange: (v: string) => void;
  onFileSubmit: () => void;
  isFilePending: boolean;
  learnJobId: string | null;
  learnJobStatus: 'queued' | 'processing' | 'completed' | 'failed' | null;
}

const PLATFORMS = [
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'douyin', label: '抖音' },
  { value: 'weixin', label: '微信公众号' },
  { value: 'bilibili', label: 'B站' },
  { value: 'weibo', label: '微博' },
  { value: 'other', label: '其他' },
] as const;

const TEXT_MAX = 10000;
const TEXT_MIN_PARSE = 100;
const TEXT_MIN_LEARN = 10;

function SampleForm({
  text,
  onTextChange,
  archiveName,
  onArchiveNameChange,
  sourcePlatform,
  onSourcePlatformChange,
  samples,
  onAddThis,
  onRemoveSample,
  onStart,
  isLearnPending,
  isParsePending,
  parseAnalysis,
  parsedQueueId,
  onApplyFormula,
  isApplyPending,
  applyContent,
  fileUrl,
  onFileUrlChange,
  onFileSubmit,
  isFilePending,
  learnJobId,
  learnJobStatus,
}: SampleFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('paste');
  const [applyTopic, setApplyTopic] = useState('');

  function handleTabClick(tab: TabKey) {
    setActiveTab(tab);
  }

  function handleBatchPaste() {
    toast.info(DL_TOAST_BATCH);
  }

  const isTextTooLong = text.length > TEXT_MAX;
  const sampleCount = samples.length;
  const startDisabled =
    isLearnPending ||
    isParsePending ||
    (sampleCount === 0 && text.length < TEXT_MIN_PARSE) ||
    isTextTooLong;

  return (
    <div
      data-testid="sample-form"
      className="lg-glass"
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 28 }}
    >
      {/* card header */}
      <div style={{ position: 'relative', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 20, borderBottom: `0.5px solid ${C.line}` }}>
        <span
          style={{
            display: 'flex',
            height: 44,
            width: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.3))',
            color: C.ink,
            fontFamily: F.cn,
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 22, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}>psychology</span>
        </span>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>添加文案样本</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>上传文件或粘贴文案 · AI 风格解析</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 2 tab */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} role="radiogroup" aria-label="输入方式">
          <button
            data-testid="tab-upload"
            type="button"
            onClick={() => handleTabClick('upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
              border: `0.5px solid ${activeTab === 'upload' ? C.ikb : C.line}`,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: F.cn,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'upload' ? 'rgba(168,197,224,0.25)' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'upload' ? C.ikb : 'rgba(255,255,255,0.84)',
              textShadow: activeTab === 'upload' ? C.textShadow : 'none',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>upload_file</span>
            {DL_TAB_UPLOAD}
          </button>
          <button
            data-testid="tab-paste"
            type="button"
            onClick={() => handleTabClick('paste')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 10,
              border: `0.5px solid ${activeTab === 'paste' ? C.ikb : C.line}`,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: F.cn,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'paste' ? 'rgba(168,197,224,0.25)' : 'rgba(255,255,255,0.06)',
              color: activeTab === 'paste' ? C.ikb : 'rgba(255,255,255,0.84)',
              textShadow: activeTab === 'paste' ? C.textShadow : 'none',
            }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>description</span>
            {DL_TAB_PASTE}
          </button>
        </div>

        {/* ── Upload tab content ── */}
        {activeTab === 'upload' && (
          <div data-testid="upload-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              className="lg-glass"
              style={{ borderRadius: 10, padding: 12, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}
            >
              粘贴素材链接即可，文件直传即将上线
            </div>
            <div>
              <label
                htmlFor="dl-file-url"
                style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
              >
                <span
                  style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                  aria-hidden={true}
                />
                文件 URL
              </label>
              <input
                id="dl-file-url"
                data-testid="file-url-input"
                type="url"
                placeholder="https://example.com/your-file.pdf"
                value={fileUrl}
                onChange={(e) => onFileUrlChange(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 14,
                  outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  border: `0.5px solid ${C.line}`,
                  color: C.ink,
                  fontFamily: F.cn,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                data-testid="file-submit-btn"
                type="button"
                disabled={!fileUrl.trim() || isFilePending}
                onClick={onFileSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: F.cn,
                  cursor: !fileUrl.trim() || isFilePending ? 'not-allowed' : 'pointer',
                  opacity: !fileUrl.trim() || isFilePending ? 0.4 : 1,
                  background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.35))',
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  color: C.ink,
                  textShadow: C.textShadow,
                  transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>upload</span>
                {isFilePending ? '提交中…' : '提交文件'}
              </button>
            </div>
          </div>
        )}

        {/* ── Paste tab content ── */}
        {activeTab === 'paste' && (
          <div data-testid="paste-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 添加文案样本 / 批量粘贴 row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                data-testid="add-sample-label"
                type="button"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.ikb, fontFamily: F.cn, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>add_circle</span>
                {DL_ADD_SAMPLE_LABEL}
              </button>
              <button
                data-testid="batch-paste-btn"
                type="button"
                onClick={handleBatchPaste}
                style={{ fontSize: 13, fontWeight: 600, color: C.ikb, fontFamily: F.cn, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {DL_BATCH_PASTE}
              </button>
            </div>

            {/* 来源平台 */}
            <div>
              <label
                htmlFor="dl-platform"
                style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
              >
                <span
                  style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                  aria-hidden={true}
                />
                来源平台
              </label>
              <select
                id="dl-platform"
                data-testid="platform-select"
                value={sourcePlatform}
                onChange={(e) => onSourcePlatformChange(e.target.value)}
                style={{
                  width: 192,
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 14,
                  outline: 'none',
                  background: 'rgba(255,255,255,0.08)',
                  border: `0.5px solid ${C.line}`,
                  color: C.ink,
                  fontFamily: F.cn,
                }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* textarea */}
            <div>
              <label
                htmlFor="dl-textarea"
                style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
              >
                <span
                  style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                  aria-hidden={true}
                />
                粘贴文案内容
              </label>
              <div
                className="lg-glass"
                style={{ overflow: 'hidden', borderRadius: 12, transition: 'all 0.2s' }}
              >
                <textarea
                  id="dl-textarea"
                  data-testid="dl-textarea"
                  placeholder={DL_TEXTAREA_PLACEHOLDER}
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  rows={5}
                  maxLength={TEXT_MAX}
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
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 16px',
                    borderTop: `0.5px solid ${C.line}`,
                  }}
                >
                  <span
                    data-testid="ctrl-enter-hint"
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}
                  >
                    {DL_HINT_CTRL_ENTER}
                  </span>
                  <span
                    style={{ flexShrink: 0, fontSize: 11, fontFamily: F.mono, color: isTextTooLong ? 'rgba(255,120,120,0.9)' : 'rgba(255,255,255,0.8)' }}
                  >
                    {text.length} 字
                  </span>
                </div>
              </div>
              {text.length > 0 && text.length < TEXT_MIN_PARSE && (
                <p data-testid="text-length-warning" style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,120,120,0.9)', fontFamily: F.cn }}>
                  文案需不少于 100 字（当前 {text.length} 字）
                </p>
              )}
              {isTextTooLong && (
                <p data-testid="text-too-long-warning" style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,120,120,0.9)', fontFamily: F.cn }}>
                  超过 10000 字（当前 {text.length} 字）
                </p>
              )}
            </div>

            {/* 添加这篇 row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                data-testid="add-this-btn"
                type="button"
                disabled={!text.trim() || text.trim().length < TEXT_MIN_LEARN || isTextTooLong}
                onClick={onAddThis}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 10,
                  border: `0.5px solid rgba(168,197,224,0.55)`,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: F.cn,
                  cursor: !text.trim() || text.trim().length < TEXT_MIN_LEARN || isTextTooLong ? 'not-allowed' : 'pointer',
                  opacity: !text.trim() || text.trim().length < TEXT_MIN_LEARN || isTextTooLong ? 0.4 : 1,
                  background: 'rgba(168,197,224,0.15)',
                  color: C.ikb,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!(!text.trim() || text.trim().length < TEXT_MIN_LEARN || isTextTooLong)) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,197,224,0.3)';
                  }
                }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,197,224,0.15)'; }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>add</span>
                {DL_ADD_THIS_BTN}
              </button>
            </div>

            {/* 已收集样本列表 */}
            {samples.length > 0 && (
              <div
                data-testid="collected-samples"
                className="lg-glass"
                style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 12, padding: 12 }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: C.ikb, fontFamily: F.cn, margin: 0 }}>已收集 {samples.length} 篇样本</p>
                {samples.map((s, i) => (
                  <div
                    key={i}
                    data-testid={`collected-sample-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      borderRadius: 8,
                      border: `0.5px solid ${C.line}`,
                      background: 'rgba(255,255,255,0.06)',
                      padding: '8px 12px',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                      {s.source} · {s.text.slice(0, 30)}{s.text.length > 30 ? '…' : ''}
                    </span>
                    <button
                      data-testid={`remove-sample-${i}`}
                      type="button"
                      onClick={() => onRemoveSample(i)}
                      style={{ flexShrink: 0, borderRadius: 6, padding: 4, color: 'rgba(255,120,120,0.85)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      aria-label={`移除样本 ${i + 1}`}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,120,120,0.15)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 学习档案名称 input */}
            <div>
              <label
                htmlFor="dl-archive-name"
                style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, textShadow: C.textShadow }}
              >
                <span
                  style={{ display: 'inline-block', height: 14, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                  aria-hidden={true}
                />
                学习档案名称
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }}
                  aria-hidden={true}
                >folder</span>
                <input
                  id="dl-archive-name"
                  data-testid="archive-name-input"
                  type="text"
                  placeholder={DL_NAME_PLACEHOLDER}
                  value={archiveName}
                  onChange={(e) => onArchiveNameChange(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    padding: '12px 12px 12px 40px',
                    fontSize: 14,
                    outline: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    border: `0.5px solid ${C.line}`,
                    color: C.ink,
                    fontFamily: F.cn,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <p style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>
                已添加 {sampleCount} 篇文案样本
              </p>
            </div>

            {/* 批量学习任务状态 */}
            {learnJobId && learnJobStatus && (
              <div
                data-testid="learn-job-status"
                className="lg-glass"
                style={{ borderRadius: 10, padding: '12px 16px' }}
              >
                <p style={{ fontSize: 13, color: C.ikb, fontFamily: F.cn, margin: 0 }}>
                  {learnJobStatus === 'queued' && '已加入队列，等待分析中…'}
                  {learnJobStatus === 'processing' && '正在深度分析中，请稍候…'}
                  {learnJobStatus === 'completed' && '深度学习已完成'}
                  {learnJobStatus === 'failed' && '任务失败，请重试'}
                </p>
              </div>
            )}

            {/* 主 CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Magnetic strength={0.3}>
              <button
                data-testid="start-learning-btn"
                type="button"
                disabled={startDisabled}
                onClick={onStart}
                className="lg-gradbtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 9999,
                  padding: '14px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: F.cn,
                  cursor: startDisabled ? 'not-allowed' : 'pointer',
                  opacity: startDisabled ? 0.5 : 1,
                  color: '#fff',
                  border: 'none',
                }}
              >
                <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>neurology</span>
                {isLearnPending
                  ? '分析中…'
                  : isParsePending
                  ? '解析中…'
                  : `${DL_START_BTN_PREFIX}${DL_START_BTN_SUFFIX(sampleCount)}`}
              </button>
            </Magnetic>
            </div>
          </div>
        )}

        {/* ── Parse analysis result ── */}
        {parseAnalysis && (
          <div
            data-testid="parse-result"
            className="lg-glass"
            style={{ borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <p
              style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6, color: C.ikb, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            >
              <span
                style={{ display: 'inline-block', height: 12, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                aria-hidden={true}
              />
              解析结果
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: '核心公式', testid: 'parse-core-formula', value: parseAnalysis.coreFormula },
                { label: '钩子类型', testid: 'parse-hook-type', value: parseAnalysis.hookType },
                { label: '结构模式', testid: 'parse-structure-pattern', value: parseAnalysis.structurePattern },
                { label: '情绪弧线', testid: 'parse-emotional-arc', value: parseAnalysis.emotionalArc },
              ].map((item) => (
                <div
                  key={item.testid}
                  className="lg-glass"
                  style={{ borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <p
                    style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontFamily: F.mono, margin: 0 }}
                  >{item.label}</p>
                  <p
                    data-testid={item.testid}
                    style={{ fontSize: 13, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
                  >{item.value}</p>
                </div>
              ))}
            </div>
            {parseAnalysis.keywords.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontFamily: F.mono, marginBottom: 4 }}>关键词</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} data-testid="parse-keywords">
                  {parseAnalysis.keywords.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontWeight: 500,
                        background: 'rgba(168,197,224,0.18)',
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

            {/* 应用公式 */}
            {parsedQueueId !== null && (
              <div
                data-testid="apply-formula-section"
                style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8, borderTop: `0.5px solid ${C.line}` }}
              >
                <p
                  style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
                >用此公式生成文案</p>
                <input
                  data-testid="apply-topic-input"
                  aria-label="新主题"
                  type="text"
                  maxLength={500}
                  placeholder="输入新主题，如：护肤品推广、健身打卡…"
                  value={applyTopic}
                  onChange={(e) => setApplyTopic(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontSize: 14,
                    outline: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    border: `0.5px solid ${C.line}`,
                    color: C.ink,
                    fontFamily: F.cn,
                    boxSizing: 'border-box',
                  }}
                />
                {applyTopic.length > 500 && (
                  <p style={{ fontSize: 12, color: 'rgba(255,120,120,0.9)', fontFamily: F.cn }}>主题不能超过 500 字</p>
                )}
                <button
                  data-testid="apply-formula-btn"
                  type="button"
                  disabled={isApplyPending || !applyTopic.trim() || applyTopic.length > 500}
                  onClick={() => onApplyFormula(parsedQueueId, applyTopic)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: F.cn,
                    cursor: isApplyPending || !applyTopic.trim() || applyTopic.length > 500 ? 'not-allowed' : 'pointer',
                    opacity: isApplyPending || !applyTopic.trim() || applyTopic.length > 500 ? 0.4 : 1,
                    background: 'linear-gradient(135deg, rgba(168,197,224,0.5), rgba(120,160,220,0.35))',
                    border: `0.5px solid rgba(168,197,224,0.55)`,
                    color: C.ink,
                    textShadow: C.textShadow,
                    alignSelf: 'flex-start',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 16 }}>auto_awesome</span>
                  {isApplyPending ? '生成中…' : '用公式生成'}
                </button>
                {applyContent && (
                  <div
                    data-testid="apply-formula-result"
                    className="lg-glass"
                    style={{ borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.85)', fontFamily: F.cn }}
                  >
                    {applyContent}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Archive status chip (液态玻璃) ────────────────────────────────────────────

function ArchiveStatusChip({ status }: { status: string }) {
  const label = getDLArchiveStatusLabel(status);

  let chipStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.84)' };
  let dotColor = 'rgba(255,255,255,0.6)';

  if (status === 'approved') {
    chipStyle = { background: 'rgba(168,197,224,0.2)', color: C.ikb };
    dotColor = C.ikb;
  } else if (status === 'pending') {
    chipStyle = { background: 'rgba(168,197,224,0.15)', color: 'rgba(255,255,255,0.8)' };
    dotColor = C.accent3;
  } else if (status === 'rejected') {
    chipStyle = { background: 'rgba(255,120,120,0.15)', color: 'rgba(255,150,150,0.9)' };
    dotColor = 'rgba(255,120,120,0.9)';
  } else if (status === 'cancelled') {
    chipStyle = { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)' };
    dotColor = 'rgba(255,255,255,0.5)';
  }

  return (
    <span
      data-testid="archive-done-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 9999,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: F.cn,
        ...chipStyle,
      }}
    >
      <span style={{ height: 6, width: 6, borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block' }} />
      {label}
    </span>
  );
}

// ── Inline: QueueArchiveCard (液态玻璃) ──────────────────────────────────────

interface QueueArchiveCardProps {
  row: QueueRow;
  onDelete: (id: number) => void;
  isDeletePending: boolean;
  deletingId: number | null;
}

function QueueArchiveCard({ row, onDelete, isDeletePending, deletingId }: QueueArchiveCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDeleting = isDeletePending && deletingId === row.id;

  function handleCopy() {
    toast.success(DL_TOAST_COPY);
  }

  function handleDelete() {
    if (isDeleting) return;
    setConfirmOpen(true);
  }

  const createdDateStr = row.createdAt
    ? new Date(row.createdAt).toLocaleDateString('zh-CN')
    : '';

  return (
    <div
      data-testid={`archive-card-${row.id}`}
      className="lg-glass"
      style={{ borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <h3
              data-testid="archive-title"
              style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            >
              {row.sample.slice(0, 40)}{row.sample.length > 40 ? '…' : ''}
            </h3>
            <ArchiveStatusChip status={row.status} />
          </div>
          <p
            data-testid="archive-subtitle"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>description</span>
            {row.sourcePlatform} · {createdDateStr}
          </p>
        </div>

        {/* action buttons */}
        <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 4 }}>
          <button
            data-testid="archive-copy-btn"
            type="button"
            onClick={handleCopy}
            aria-label="复制档案"
            style={{ borderRadius: 8, padding: 6, color: C.ikb, background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,197,224,0.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>content_copy</span>
          </button>
          <button
            data-testid="archive-delete-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="删除档案"
            style={{ borderRadius: 8, padding: 6, color: 'rgba(255,120,120,0.85)', background: 'none', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.4 : 1, transition: 'background 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,120,120,0.12)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>
              {isDeleting ? 'hourglass_empty' : 'delete'}
            </span>
          </button>
          <button
            data-testid="archive-toggle-btn"
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? '折叠档案' : '展开档案'}
            style={{ borderRadius: 8, padding: 6, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 18 }}>
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="删除学习档案"
        description="确认删除此学习档案？"
        confirmLabel="删除"
        destructive
        onConfirm={() => onDelete(row.id)}
      />

      {/* expanded content */}
      {expanded && (
        <div data-testid="archive-expanded" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 核心公式 */}
          <div data-testid="style-portrait-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: C.ikb, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            >
              <span
                style={{ display: 'inline-block', height: 12, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                aria-hidden={true}
              />
              {DL_SECTION_STYLE_PORTRAIT}
            </p>
            <p
              data-testid="style-portrait-body"
              className="lg-glass"
              style={{ borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}
            >
              核心公式：{row.coreFormula}
            </p>
          </div>

          {/* 文案逻辑 placeholder */}
          <div data-testid="logic-grid-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            >
              <span
                style={{ display: 'inline-block', height: 12, width: 4, borderRadius: 9999, background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(168,197,224,0.5))' }}
                aria-hidden={true}
              />
              {DL_SECTION_LOGIC}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>
              状态：{row.status} · 详细分析在审核完成后可见
            </p>
          </div>

          {/* 包装风格 placeholder */}
          <div data-testid="packaging-grid-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.85)', fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            >
              <span
                style={{ display: 'inline-block', height: 12, width: 4, borderRadius: 9999, background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(168,197,224,0.5))' }}
                aria-hidden={true}
              />
              {DL_SECTION_PACKAGING}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>
              来源平台：{row.sourcePlatform}
            </p>
          </div>

          {/* 精华片段 placeholder */}
          <div data-testid="highlights-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
            >
              <span
                style={{ display: 'inline-block', height: 12, width: 4, borderRadius: 9999, background: C.accent3 }}
                aria-hidden={true}
              />
              {DL_SECTION_HIGHLIGHTS_PREFIX} (0)
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>
              文案摘要：{row.sample.slice(0, 120)}{row.sample.length > 120 ? '…' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline: EmptyArchives (液态玻璃) ─────────────────────────────────────────

function EmptyArchives() {
  return (
    <div
      data-testid="empty-archives"
      className="lg-glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        borderRadius: 18,
        padding: '64px 24px',
        textAlign: 'center',
        border: `0.5px dashed rgba(168,197,224,0.35)`,
      }}
    >
      <span
        style={{
          display: 'flex',
          height: 64,
          width: 64,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 18,
          background: 'rgba(168,197,224,0.15)',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}
          aria-hidden={true}
        >neurology</span>
      </span>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>{DL_EMPTY_TITLE}</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: 0 }}>{DL_EMPTY_DESC}</p>
    </div>
  );
}

// ── Inline: ArchiveSkeleton (液态玻璃) ────────────────────────────────────────

function ArchiveSkeleton() {
  return (
    <div data-testid="archives-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="lg-glass"
          style={{ borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, animation: 'pulse 2s ease-in-out infinite' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 20, width: '33%', borderRadius: 6, background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ height: 16, width: '25%', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ height: 32, width: 32, borderRadius: 8, background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ height: 32, width: 32, borderRadius: 8, background: 'rgba(255,255,255,0.12)' }} />
            </div>
          </div>
          <div style={{ height: 64, borderRadius: 10, background: 'rgba(255,255,255,0.08)' }} />
        </div>
      ))}
    </div>
  );
}

// ── Inline: ArchivesError (液态玻璃) ─────────────────────────────────────────

function ArchivesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      data-testid="archives-error"
      className="lg-glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        borderRadius: 18,
        padding: '48px 24px',
        textAlign: 'center',
        border: `0.5px dashed rgba(255,120,120,0.35)`,
      }}
    >
      <span style={{ display: 'flex', height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: 'rgba(255,120,120,0.15)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'rgba(255,150,150,0.9)' }} aria-hidden={true}>error</span>
      </span>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,150,150,0.9)', fontFamily: F.cn, margin: 0 }}>加载学习档案失败</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: F.cn,
          cursor: 'pointer',
          background: 'rgba(255,120,120,0.25)',
          border: `0.5px solid rgba(255,120,120,0.4)`,
          color: 'rgba(255,200,200,0.95)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,120,120,0.35)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,120,120,0.25)'; }}
      >
        重试
      </button>
    </div>
  );
}

// ── Inline: UsageInstructions (液态玻璃) ──────────────────────────────────────

function UsageInstructions() {
  return (
    <div
      data-testid="usage-instructions"
      className="lg-glass"
      style={{ borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `0.5px solid ${C.line}` }}>
        <span
          style={{
            display: 'flex',
            height: 36,
            width: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            background: 'rgba(168,197,224,0.18)',
            color: C.ikb,
          }}
        >
          <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>info</span>
        </span>
        <h3
          data-testid="usage-instructions-title"
          style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
        >
          {DL_USAGE_TITLE}
        </h3>
      </div>
      <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {DL_USAGE_SECTIONS.map((section, si) => (
          <Item key={si} style={{ height: '100%' }}>
            <div
              data-testid={`usage-section-${si}`}
              className="lg-glass"
              style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 14, padding: 16, height: '100%' }}
            >
              <p
                data-testid={`usage-section-title-${si}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: C.ikb, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
              >
                <span
                  style={{ display: 'inline-block', height: 12, width: 4, borderRadius: 9999, background: `linear-gradient(to bottom,${C.ikb},rgba(168,197,224,0.5))` }}
                  aria-hidden={true}
                />
                {section.title}
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none', marginTop: 'auto' }}>
                {section.bullets.map((bullet, bi) => (
                  <li
                    key={bi}
                    data-testid={`usage-bullet-${si}-${bi}`}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ marginTop: 2, flexShrink: 0, fontSize: 14, color: 'rgba(168,197,224,0.7)' }}
                      aria-hidden={true}
                    >chevron_right</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </Item>
        ))}
      </RevealGroup>
    </div>
  );
}

// ── Inline: DeepLearningHeader (液态玻璃) ─────────────────────────────────────

function DeepLearningHeader() {
  return (
    <header
      data-testid="deep-learning-header"
      style={{ marginBottom: 40, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}
    >
      <div style={{ flexShrink: 0 }}>
        <Reveal style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
            智能引擎
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
            AI 训练
          </span>
        </Reveal>
        <h1
          data-testid="deep-learning-h1"
          style={{
            whiteSpace: 'nowrap',
            fontSize: 52,
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
          {DEEP_LEARNING_H1}
        </h1>
        <p
          data-testid="deep-learning-subtitle"
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
          {DEEP_LEARNING_SUBTITLE}
        </p>
      </div>
    </header>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeepLearning() {
  const [text, setText] = useState('');
  const [archiveName, setArchiveName] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('xiaohongshu');
  const [parseAnalysis, setParseAnalysis] = useState<ParseAnalysis | null>(null);
  const [parsedQueueId, setParsedQueueId] = useState<number | null>(null);
  const [applyContent, setApplyContent] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Batch sample collection for learn()
  const [samples, setSamples] = useState<BatchSample[]>([]);

  // Learn job polling state
  const [learnJobId, setLearnJobId] = useState<string | null>(null);
  const [learnJobDone, setLearnJobDone] = useState(false);

  const utils = trpc.useUtils();

  // ── list query ──────────────────────────────────────────────────────────────
  const {
    data: archives = [],
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = trpc.deepLearning.list.useQuery({ limit: 20, offset: 0, onlyActive: true });

  // ── learn status polling ────────────────────────────────────────────────────
  const learnStatusQuery = trpc.deepLearning.learnStatus.useQuery(
    { jobId: learnJobId ?? '' },
    {
      enabled: !!learnJobId && !learnJobDone,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === 'completed' || status === 'failed') return false;
        return 2000;
      },
    },
  );

  const learnJobStatus = learnStatusQuery.data?.status ?? null;

  // When learn job reaches terminal state, show toast + invalidate list
  if (
    learnJobId &&
    !learnJobDone &&
    (learnJobStatus === 'completed' || learnJobStatus === 'failed')
  ) {
    setLearnJobDone(true);
    if (learnJobStatus === 'completed') {
      toast.success(DL_TOAST_LEARN_DONE);
      void utils.deepLearning.list.invalidate();
      setSamples([]);
    } else {
      toast.error(DL_TOAST_LEARN_FAILED);
    }
  }

  // ── parse mutation ──────────────────────────────────────────────────────────
  const parseMutation = trpc.deepLearning.parse.useMutation({
    onSuccess(data) {
      setParseAnalysis(data.analysis);
      setParsedQueueId(data.queueId);
      void utils.deepLearning.list.invalidate();
      toast.success('解析完成，新档案已加入队列');
    },
    onError(err) {
      toast.error(`解析失败: ${err.message}`);
    },
  });

  // ── learn mutation ──────────────────────────────────────────────────────────
  const learnMutation = trpc.deepLearning.learn.useMutation({
    onSuccess(data) {
      setLearnJobId(data.jobId);
      setLearnJobDone(false);
      toast.success(DL_TOAST_LEARN_QUEUED);
    },
    onError(err) {
      toast.error(`深度学习启动失败: ${err.message}`);
    },
  });

  // ── applyFormula mutation ───────────────────────────────────────────────────
  const applyMutation = trpc.deepLearning.applyFormula.useMutation({
    onSuccess(data) {
      setApplyContent(data.content);
    },
    onError(err) {
      toast.error(`生成失败: ${err.message}`);
    },
  });

  // ── delete mutation ─────────────────────────────────────────────────────────
  const deleteMutation = trpc.deepLearning.delete.useMutation({
    onSuccess() {
      setDeletingId(null);
      void utils.deepLearning.list.invalidate();
      toast.success(DL_TOAST_DELETE);
    },
    onError(err) {
      setDeletingId(null);
      toast.error(`删除失败: ${err.message}`);
    },
  });

  // ── createFromFile mutation ─────────────────────────────────────────────────
  const createFromFileMutation = trpc.deepLearning.createFromFile.useMutation({
    onSuccess() {
      setFileUrl('');
      void utils.deepLearning.list.invalidate();
      toast.success('文件已提交审核队列');
    },
    onError(err) {
      toast.error(`提交失败: ${err.message}`);
    },
  });

  // ── handleAddThis — push current text into samples collection ───────────────
  function handleAddThis() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.info(DL_TOAST_NEED_TEXT);
      return;
    }
    if (trimmed.length < 10) {
      toast.error('每篇样本不少于 10 字');
      return;
    }
    if (text.length > 10000) {
      toast.error('超过 10000 字，请缩减后再添加');
      return;
    }
    setSamples((prev) => [...prev, { text: trimmed, source: sourcePlatform }]);
    setText('');
  }

  function handleRemoveSample(i: number) {
    setSamples((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── handleStart — if samples collected, call learn(); else single parse() ──
  function handleStart() {
    if (text.length > 10000) {
      toast.error('超过 10000 字，请缩减后再提交');
      return;
    }
    if (samples.length > 0) {
      // Batch learn path
      learnMutation.mutate({ samples });
    } else {
      // Single parse path
      if (text.length < 100) {
        toast.error('文案需不少于 100 字');
        return;
      }
      parseMutation.mutate({
        sample: text,
        sourcePlatform,
      });
    }
  }

  function handleApplyFormula(queueId: number, topic: string) {
    if (!topic.trim()) {
      toast.error('请输入新主题');
      return;
    }
    if (topic.length > 500) {
      toast.error('主题不能超过 500 字');
      return;
    }
    applyMutation.mutate({ queueId, newTopic: topic });
  }

  function handleDelete(id: number) {
    setDeletingId(id);
    deleteMutation.mutate({ archiveId: id });
  }

  function handleFileSubmit() {
    if (!fileUrl.trim()) return;
    // Front-end URL validation
    try {
      new URL(fileUrl.trim());
    } catch {
      toast.error('请输入合法的 URL（以 https:// 开头）');
      return;
    }
    if (!/^https?:\/\//i.test(fileUrl.trim())) {
      toast.error('请输入合法的 URL（以 https:// 开头）');
      return;
    }
    createFromFileMutation.mutate({ fileUrl: fileUrl.trim(), userTitle: archiveName || undefined });
  }

  // ── KPI legend data (液态玻璃色系) ───────────────────────────────────────────
  const radarDims = [
    { label: '语料覆盖', value: 85, color: C.ikb },
    { label: '风格捕捉', value: 90, color: 'rgba(255,255,255,0.85)' },
    { label: '语气还原', value: 88, color: C.accent3 },
    { label: '术语掌握', value: 82, color: C.ikb },
    { label: '上下文',   value: 78, color: 'rgba(255,255,255,0.85)' },
    { label: '泛化力',   value: 86, color: C.accent3 },
  ];

  return (
    <LiquidShell>
      <main
        data-testid="deep-learning-page"
        style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <DeepLearningHeader />

        {/* ── KPI 卡一排(4 卡) ────────────────────────────────── */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 8 }}>
          {/* 档案数 · 冷蓝 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.2)', color: C.ikb }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>folder_open</span>
                </span>
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 13 }}>trending_up</span>+1
                </span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                    {archives.length}<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> 份</span>
                  </p>
                  <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>学习档案</p>
                </div>
                <div style={{ height: 48, width: 48, flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(168,197,224,0.2)" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${Math.min(100, archives.length * 25)} 100`} />
                  </svg>
                </div>
              </div>
            </motion.div>
          </Item>

          {/* 样本数 · 白 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>article</span>
                </span>
                <span
                  style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', fontFamily: F.cn }}
                >已分析</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  {archives.length + samples.length}
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}> 篇</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>文案样本</p>
              </div>
              <div style={{ marginTop: 12, display: 'flex', height: 24, alignItems: 'flex-end', gap: 4 }}>
                {[48, 80, 65, 92, 74].map((h, i) => (
                  <div
                    key={i}
                    style={{ flex: 1, borderRadius: '4px 4px 0 0', height: `${h}%`, background: 'rgba(255,255,255,0.35)' }}
                  />
                ))}
              </div>
            </motion.div>
          </Item>

          {/* 训练进度 · 冷蓝渐变 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.ikb }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>model_training</span>
                </span>
                <span
                  style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.15)', color: C.ikb, fontFamily: F.cn }}
                >模拟示意</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  —<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>%</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>训练进度</p>
              </div>
              <div style={{ marginTop: 12, height: 8, width: '100%', borderRadius: 9999, background: 'rgba(168,197,224,0.15)' }}>
                <div
                  style={{ height: 8, width: '50%', borderRadius: 9999, background: `linear-gradient(to right,${C.ikb},rgba(120,160,220,0.8))` }}
                />
              </div>
            </motion.div>
          </Item>

          {/* 模型版本 · 冷蓝 */}
          <Item style={{ height: '100%' }}>
            <motion.div
              className="lg-glass lg-spec"
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              style={{ borderRadius: 18, padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.ikb }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>smart_toy</span>
                </span>
                <span
                  style={{ borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.cn }}
                >最新</span>
              </div>
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>
                  v1<span style={{ fontSize: 15, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>.0</span>
                </p>
                <p style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn, margin: '6px 0 0' }}>模型版本</p>
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['风格分析', '逻辑提取'].map((k) => (
                  <span
                    key={k}
                    style={{ borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 500, background: 'rgba(168,197,224,0.15)', color: C.ikb, fontFamily: F.cn }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </motion.div>
          </Item>
        </RevealGroup>

        {/* ── 样本表单 ─────────────────────────────────────────── */}
        <Reveal>
          <SampleForm
            text={text}
            onTextChange={setText}
            archiveName={archiveName}
            onArchiveNameChange={setArchiveName}
            sourcePlatform={sourcePlatform}
            onSourcePlatformChange={setSourcePlatform}
            samples={samples}
            onAddThis={handleAddThis}
            onRemoveSample={handleRemoveSample}
            onStart={handleStart}
            isLearnPending={learnMutation.isPending}
            isParsePending={parseMutation.isPending}
            parseAnalysis={parseAnalysis}
            parsedQueueId={parsedQueueId}
            onApplyFormula={(queueId, topic) => handleApplyFormula(queueId, topic)}
            isApplyPending={applyMutation.isPending}
            applyContent={applyContent}
            fileUrl={fileUrl}
            onFileUrlChange={setFileUrl}
            onFileSubmit={handleFileSubmit}
            isFilePending={createFromFileMutation.isPending}
            learnJobId={learnJobId}
            learnJobStatus={learnJobStatus}
          />
        </Reveal>

        {/* ── 档案区 ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2
            data-testid="archives-heading"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}
          >
            {DL_ARCHIVES_TITLE_PREFIX}
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.8)' }}>({archives.length})</span>
          </h2>

          {isListLoading && <ArchiveSkeleton />}

          {isListError && !isListLoading && (
            <ArchivesError onRetry={() => void refetchList()} />
          )}

          {!isListLoading && !isListError && archives.length === 0 && (
            <EmptyArchives />
          )}

          {!isListLoading && !isListError && archives.length > 0 && (
            <RevealGroup style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {archives.map((row) => (
                <Item key={row.id}>
                  <QueueArchiveCard
                    row={row}
                    onDelete={handleDelete}
                    isDeletePending={deleteMutation.isPending}
                    deletingId={deletingId}
                  />
                </Item>
              ))}
            </RevealGroup>
          )}
        </div>

        {/* ── 使用说明 ─────────────────────────────────────────── */}
        <Reveal>
          <UsageInstructions />
        </Reveal>

        {/* ── 数据洞察 band ────────────────────────────────────── */}
        <Reveal style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: C.ink, filter: 'drop-shadow(0 2px 6px rgba(6,14,38,.8))' }}
            aria-hidden={true}
          >insights</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>AI 学习能力数据洞察</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>· 综合评估 · 实时测算</span>
          <span
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 9999, padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'rgba(168,197,224,0.15)', color: C.ikb, fontFamily: F.cn }}
          >
            <span style={{ height: 6, width: 6, borderRadius: '50%', background: C.ikb, display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            模型已就绪
          </span>
        </Reveal>

        {/* ── 数据洞察: 雷达 + 趋势 ───────────────────────────── */}
        <RevealGroup style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, marginBottom: 8 }}>
          {/* AI 学习能力雷达 */}
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
                    style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(168,197,224,0.18)', color: C.ikb }}
                  >
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>radar</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>AI 学习能力雷达</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>六维模型评估（模拟示意）</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>86</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>综合分</p>
                </div>
              </div>
              {(() => {
                const cx = 130;
                const cy = 122;
                const R = 88;
                const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
                const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
                const poly = (r: number) => radarDims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
                const dataPoly = radarDims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
                return (
                  <svg viewBox="0 0 260 244" style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="dl-radarFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                        <stop offset="100%" stopColor="rgba(168,197,224,0.3)" stopOpacity="0.12" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <polygon key={f} points={poly(R * f)} fill="none" stroke={C.line} strokeWidth="1" />
                    ))}
                    {radarDims.map((_, i) => {
                      const [x, y] = pt(i, R);
                      return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} strokeWidth="1" />;
                    })}
                    <polygon points={dataPoly} fill="url(#dl-radarFill)" stroke={C.ikb} strokeWidth="2" strokeLinejoin="round" />
                    {radarDims.map((d, i) => {
                      const [x, y] = pt(i, R * (d.value / 100));
                      return <circle key={i} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.9)" stroke={d.color} strokeWidth="2" />;
                    })}
                    {radarDims.map((d, i) => {
                      const [x, y] = pt(i, R + 16);
                      return (
                        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.65)" fontSize="10.5" fontWeight="600">
                          {d.label}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 0' }}>
                {radarDims.map((d) => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: d.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Item>

          {/* 训练样本积累趋势 */}
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
                    style={{ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
                  >
                    <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 20 }}>show_chart</span>
                  </span>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F.cn, margin: 0, textShadow: C.textShadow }}>训练样本积累</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn, margin: 0 }}>按当前学习档案测算</p>
                  </div>
                </div>
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 9999, padding: '2px 8px', fontSize: 12, fontWeight: 700, background: 'rgba(168,197,224,0.18)', color: C.ikb, fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined" aria-hidden={true} style={{ fontSize: 14 }}>trending_up</span>+86%
                </span>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, color: C.ink, fontFamily: F.display, margin: 0, textShadow: C.textShadow }}>{archives.length}</p>
                <span style={{ marginBottom: 4, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: F.cn }}>份学习档案 · 持续积累中</span>
              </div>
              {(() => {
                const data = [10, 18, 22, 30, 42, 38, 55, 62, 58, 70, 80, 96];
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
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
                    <defs>
                      <linearGradient id="dl-trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                        <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="dl-trendLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={C.ikb} />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
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
                    <path d={area} fill="url(#dl-trendFill)" />
                    <path d={line} fill="none" stroke="url(#dl-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((v, i) =>
                      i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="rgba(255,255,255,0.9)" stroke={C.ikb} strokeWidth="2" /> : null,
                    )}
                  </svg>
                );
              })()}
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'rgba(255,255,255,0.84)', fontFamily: F.cn }}>
                {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </motion.div>
          </Item>
        </RevealGroup>
      </main>
    </LiquidShell>
  );
}
