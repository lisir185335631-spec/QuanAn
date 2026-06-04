/**
 * DeepLearning.tsx — /deep-learning · IKB 红蓝紫渐变体系
 * 阶段2 phase-2: 接真 trpc.deepLearning.* (list/parse/delete/applyFormula/createFromFile/learn/learnStatus)
 * 逻辑/testid 零回退 · IKB 皮 · 5 组件 inline
 */

import '@/styles/ikb-hero.css';

import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { C, F } from '@/components/home/ikb/system';
import { IKBLayout } from '@/layouts/IKBLayout';
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

// ── Inline: SampleForm (IKB) ─────────────────────────────────────────────────

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

function SampleFormPioneer({
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
      className="ikb-hovercard relative overflow-hidden rounded-xl p-6"
      style={{ background: `linear-gradient(135deg,${C.paper},${C.base})`, border: `1px solid ${C.line}` }}
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.ikb}08` }} />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full blur-2xl"
        style={{ background: `${C.burgundy}06` }} />

      {/* card header */}
      <div className="relative mb-6 flex items-center gap-3 pb-5" style={{ borderBottom: `1px solid ${C.line}` }}>
        <span
          className="ikb-gradbtn flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg"
          style={{ fontFamily: F.cn }}
        >
          <span className="material-symbols-outlined" aria-hidden={true}>psychology</span>
        </span>
        <div>
          <h2 className="text-[18px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>添加文案样本</h2>
          <p className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>上传文件或粘贴文案 · AI 风格解析</p>
        </div>
      </div>

      <div className="relative space-y-5">
        {/* 2 tab */}
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="输入方式">
          <button
            data-testid="tab-upload"
            type="button"
            onClick={() => handleTabClick('upload')}
            className="ikb-focusring flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors"
            style={
              activeTab === 'upload'
                ? { borderColor: C.ikb, background: C.ikb, color: C.paper, fontFamily: F.cn }
                : { borderColor: C.line, color: '#6b7280', background: C.base, fontFamily: F.cn }
            }
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>upload_file</span>
            {DL_TAB_UPLOAD}
          </button>
          <button
            data-testid="tab-paste"
            type="button"
            onClick={() => handleTabClick('paste')}
            className="ikb-focusring flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors"
            style={
              activeTab === 'paste'
                ? { borderColor: C.ikb, background: C.ikb, color: C.paper, fontFamily: F.cn }
                : { borderColor: C.line, color: '#6b7280', background: C.base, fontFamily: F.cn }
            }
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>description</span>
            {DL_TAB_PASTE}
          </button>
        </div>

        {/* ── Upload tab content ── */}
        {activeTab === 'upload' && (
          <div data-testid="upload-tab-content" className="space-y-4">
            <div
              className="rounded-lg border p-3 text-[12px]"
              style={{ borderColor: `${C.accent3}30`, background: `${C.accent3}08`, color: C.purpleText, fontFamily: F.cn }}
            >
              文件上传暂用文件链接提交（S3 直传 PRD-7 上线后启用）
            </div>
            <div>
              <label
                htmlFor="dl-file-url"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide before:h-3.5 before:w-1 before:rounded-full before:content-['']"
                style={{ color: C.ink, fontFamily: F.cn, ['--tw-gradient-from' as string]: C.ikb }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
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
                className="ikb-input w-full rounded-lg px-4 py-3 text-[14px] outline-none transition-all focus-within:ring-1"
                style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.cn }}
              />
            </div>
            <div className="flex justify-end">
              <button
                data-testid="file-submit-btn"
                type="button"
                disabled={!fileUrl.trim() || isFilePending}
                onClick={onFileSubmit}
                className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: F.cn }}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>upload</span>
                {isFilePending ? '提交中…' : '提交文件'}
              </button>
            </div>
          </div>
        )}

        {/* ── Paste tab content ── */}
        {activeTab === 'paste' && (
          <div data-testid="paste-tab-content" className="space-y-4">
            {/* 添加文案样本 / 批量粘贴 row */}
            <div className="flex items-center justify-between">
              <button
                data-testid="add-sample-label"
                type="button"
                className="ikb-focusring flex items-center gap-1.5 text-[13px] font-semibold hover:opacity-80"
                style={{ color: C.ikb, fontFamily: F.cn }}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>add_circle</span>
                {DL_ADD_SAMPLE_LABEL}
              </button>
              <button
                data-testid="batch-paste-btn"
                type="button"
                onClick={handleBatchPaste}
                className="ikb-focusring text-[13px] font-semibold hover:opacity-80"
                style={{ color: C.ikb, fontFamily: F.cn }}
              >
                {DL_BATCH_PASTE}
              </button>
            </div>

            {/* 来源平台 */}
            <div>
              <label
                htmlFor="dl-platform"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
                  aria-hidden={true}
                />
                来源平台
              </label>
              <select
                id="dl-platform"
                data-testid="platform-select"
                value={sourcePlatform}
                onChange={(e) => onSourcePlatformChange(e.target.value)}
                className="ikb-input w-48 rounded-lg px-3 py-2.5 text-[14px] outline-none transition-all focus-within:ring-1"
                style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.cn }}
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
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
                  aria-hidden={true}
                />
                粘贴文案内容
              </label>
              <div
                className="overflow-hidden rounded-xl transition-all focus-within:ring-1"
                style={{ border: `1px solid ${C.line}`, background: C.base }}
              >
                <textarea
                  id="dl-textarea"
                  data-testid="dl-textarea"
                  placeholder={DL_TEXTAREA_PLACEHOLDER}
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  rows={5}
                  maxLength={TEXT_MAX}
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                  style={{ color: C.ink, fontFamily: F.cn }}
                />
                <div
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                  style={{ borderTop: `1px solid ${C.line}`, background: 'rgba(255,255,255,0.6)' }}
                >
                  <span
                    data-testid="ctrl-enter-hint"
                    className="text-[11px]"
                    style={{ color: '#6b7280', fontFamily: F.cn }}
                  >
                    {DL_HINT_CTRL_ENTER}
                  </span>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ color: isTextTooLong ? '#dc2626' : '#6b7280', fontFamily: F.mono }}
                  >
                    {text.length} 字
                  </span>
                </div>
              </div>
              {text.length > 0 && text.length < TEXT_MIN_PARSE && (
                <p data-testid="text-length-warning" className="mt-1.5 text-[12px]" style={{ color: '#dc2626', fontFamily: F.cn }}>
                  文案需不少于 100 字（当前 {text.length} 字）
                </p>
              )}
              {isTextTooLong && (
                <p data-testid="text-too-long-warning" className="mt-1.5 text-[12px]" style={{ color: '#dc2626', fontFamily: F.cn }}>
                  超过 10000 字（当前 {text.length} 字）
                </p>
              )}
            </div>

            {/* 添加这篇 row */}
            <div className="flex justify-end">
              <button
                data-testid="add-this-btn"
                type="button"
                disabled={!text.trim() || text.trim().length < TEXT_MIN_LEARN || isTextTooLong}
                onClick={onAddThis}
                className="ikb-focusring flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: C.ikb, color: C.ikb, fontFamily: F.cn,
                  ['--hover-bg' as string]: C.ikb }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.ikb; (e.currentTarget as HTMLButtonElement).style.color = C.paper; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = C.ikb; }}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>add</span>
                {DL_ADD_THIS_BTN}
              </button>
            </div>

            {/* 已收集样本列表 */}
            {samples.length > 0 && (
              <div
                data-testid="collected-samples"
                className="space-y-2 rounded-lg border p-3"
                style={{ borderColor: `${C.ikb}28`, background: `${C.ikb}06` }}
              >
                <p className="text-[12px] font-semibold" style={{ color: C.ikb, fontFamily: F.cn }}>已收集 {samples.length} 篇样本</p>
                {samples.map((s, i) => (
                  <div
                    key={i}
                    data-testid={`collected-sample-${i}`}
                    className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-2"
                    style={{ borderColor: C.line }}
                  >
                    <span className="flex-1 truncate text-[13px]" style={{ color: '#444653', fontFamily: F.cn }}>
                      {s.source} · {s.text.slice(0, 30)}{s.text.length > 30 ? '…' : ''}
                    </span>
                    <button
                      data-testid={`remove-sample-${i}`}
                      type="button"
                      onClick={() => onRemoveSample(i)}
                      className="ikb-focusring shrink-0 rounded p-1 transition-colors"
                      style={{ color: C.burgundy }}
                      aria-label={`移除样本 ${i + 1}`}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${C.burgundy}14`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 学习档案名称 input */}
            <div>
              <label
                htmlFor="dl-archive-name"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide"
                style={{ color: C.ink, fontFamily: F.cn }}
              >
                <span
                  className="inline-block h-3.5 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
                  aria-hidden={true}
                />
                学习档案名称
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
                  style={{ color: '#6b7280' }}
                  aria-hidden={true}
                >folder</span>
                <input
                  id="dl-archive-name"
                  data-testid="archive-name-input"
                  type="text"
                  placeholder={DL_NAME_PLACEHOLDER}
                  value={archiveName}
                  onChange={(e) => onArchiveNameChange(e.target.value)}
                  className="ikb-input w-full rounded-lg py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus-within:ring-1"
                  style={{ border: `1px solid ${C.line}`, background: C.base, color: C.ink, fontFamily: F.cn }}
                />
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
                已添加 {sampleCount} 篇文案样本
              </p>
            </div>

            {/* 批量学习任务状态 */}
            {learnJobId && learnJobStatus && (
              <div
                data-testid="learn-job-status"
                className="rounded-lg border px-4 py-3"
                style={{ borderColor: `${C.ikb}28`, background: `${C.ikb}06` }}
              >
                <p className="text-[13px]" style={{ color: C.ikb, fontFamily: F.cn }}>
                  {learnJobStatus === 'queued' && '已加入队列，等待分析中…'}
                  {learnJobStatus === 'processing' && '正在深度分析中，请稍候…'}
                  {learnJobStatus === 'completed' && '深度学习已完成'}
                  {learnJobStatus === 'failed' && '任务失败，请重试'}
                </p>
              </div>
            )}

            {/* 主 CTA */}
            <button
              data-testid="start-learning-btn"
              type="button"
              disabled={startDisabled}
              onClick={onStart}
              className="ikb-gradbtn ikb-focusring flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-[12px] font-bold uppercase tracking-widest text-white transition-all active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              style={{ fontFamily: F.cn }}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>neurology</span>
              {isLearnPending
                ? '分析中…'
                : isParsePending
                ? '解析中…'
                : `${DL_START_BTN_PREFIX}${DL_START_BTN_SUFFIX(sampleCount)}`}
            </button>
          </div>
        )}

        {/* ── Parse analysis result ── */}
        {parseAnalysis && (
          <div
            data-testid="parse-result"
            className="rounded-xl border p-5 space-y-4 ikb-hovercard"
            style={{ borderColor: `${C.ikb}28`, background: `${C.ikb}06` }}
          >
            <p
              className="text-[13px] font-extrabold tracking-wide flex items-center gap-1.5"
              style={{ color: C.ikb, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
                aria-hidden={true}
              />
              解析结果
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '核心公式', testid: 'parse-core-formula', value: parseAnalysis.coreFormula },
                { label: '钩子类型', testid: 'parse-hook-type', value: parseAnalysis.hookType },
                { label: '结构模式', testid: 'parse-structure-pattern', value: parseAnalysis.structurePattern },
                { label: '情绪弧线', testid: 'parse-emotional-arc', value: parseAnalysis.emotionalArc },
              ].map((item) => (
                <div
                  key={item.testid}
                  className="rounded-lg border bg-white p-3 space-y-1"
                  style={{ borderColor: C.line }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: '#6b7280', fontFamily: F.mono }}
                  >{item.label}</p>
                  <p
                    data-testid={item.testid}
                    className="text-[13px]"
                    style={{ color: C.ink, fontFamily: F.cn }}
                  >{item.value}</p>
                </div>
              ))}
            </div>
            {parseAnalysis.keywords.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: '#6b7280', fontFamily: F.mono }}>关键词</p>
                <div className="flex flex-wrap gap-1" data-testid="parse-keywords">
                  {parseAnalysis.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.cn }}
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
                className="space-y-3 pt-2"
                style={{ borderTop: `1px solid ${C.line}` }}
              >
                <p
                  className="text-[13px] font-extrabold tracking-wide"
                  style={{ color: C.burgundyText, fontFamily: F.cn }}
                >用此公式生成文案</p>
                <input
                  data-testid="apply-topic-input"
                  aria-label="新主题"
                  type="text"
                  maxLength={500}
                  placeholder="输入新主题，如：护肤品推广、健身打卡…"
                  value={applyTopic}
                  onChange={(e) => setApplyTopic(e.target.value)}
                  className="ikb-input w-full rounded-lg border bg-white px-4 py-2.5 text-[14px] outline-none transition-all focus-within:ring-1"
                  style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
                />
                {applyTopic.length > 500 && (
                  <p className="text-[12px]" style={{ color: '#dc2626', fontFamily: F.cn }}>主题不能超过 500 字</p>
                )}
                <button
                  data-testid="apply-formula-btn"
                  type="button"
                  disabled={isApplyPending || !applyTopic.trim() || applyTopic.length > 500}
                  onClick={() => onApplyFormula(parsedQueueId, applyTopic)}
                  className="ikb-gradbtn ikb-focusring flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ fontFamily: F.cn }}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden={true}>auto_awesome</span>
                  {isApplyPending ? '生成中…' : '用公式生成'}
                </button>
                {applyContent && (
                  <div
                    data-testid="apply-formula-result"
                    className="rounded-lg border bg-white p-4 text-[14px] leading-relaxed whitespace-pre-wrap"
                    style={{ borderColor: C.line, color: C.ink, fontFamily: F.cn }}
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

// ── Archive status chip (IKB) ─────────────────────────────────────────────────

function ArchiveStatusChip({ status }: { status: string }) {
  const label = getDLArchiveStatusLabel(status);

  let chipStyle: React.CSSProperties = { background: '#f3f4f6', color: '#6b7280' };
  let dotColor = '#6b7280';

  if (status === 'approved') {
    chipStyle = { background: `${C.ikb}12`, color: C.ikb };
    dotColor = C.ikb;
  } else if (status === 'pending') {
    chipStyle = { background: `${C.accent3}14`, color: C.purpleText };
    dotColor = C.accent3;
  } else if (status === 'rejected') {
    chipStyle = { background: `${C.burgundy}12`, color: C.burgundyText };
    dotColor = C.burgundy;
  } else if (status === 'cancelled') {
    chipStyle = { background: '#e5e7eb', color: '#6b7280' };
    dotColor = '#6b7280';
  }

  return (
    <span
      data-testid="archive-done-chip"
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
      style={{ ...chipStyle, fontFamily: F.cn }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  );
}

// ── Inline: QueueArchiveCard (IKB) — wraps a QueueRow ────────────────────────

interface QueueArchiveCardProps {
  row: QueueRow;
  onDelete: (id: number) => void;
  isDeletePending: boolean;
  deletingId: number | null;
}

function QueueArchiveCardPioneer({ row, onDelete, isDeletePending, deletingId }: QueueArchiveCardProps) {
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
      className="ikb-hovercard rounded-xl border p-6 space-y-6"
      style={{ background: C.paper, border: `1px solid ${C.line}` }}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              data-testid="archive-title"
              className="text-[16px] font-bold"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              {row.sample.slice(0, 40)}{row.sample.length > 40 ? '…' : ''}
            </h3>
            <ArchiveStatusChip status={row.status} />
          </div>
          <p
            data-testid="archive-subtitle"
            className="flex items-center gap-1 text-[12px]"
            style={{ color: '#6b7280', fontFamily: F.cn }}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>description</span>
            {row.sourcePlatform} · {createdDateStr}
          </p>
        </div>

        {/* action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            data-testid="archive-copy-btn"
            type="button"
            onClick={handleCopy}
            aria-label="复制档案"
            className="ikb-focusring rounded-md p-1.5 transition-colors"
            style={{ color: C.ikb }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${C.ikb}12`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>content_copy</span>
          </button>
          <button
            data-testid="archive-delete-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="删除档案"
            className="ikb-focusring rounded-md p-1.5 transition-colors disabled:opacity-40"
            style={{ color: C.burgundy }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${C.burgundy}12`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
              {isDeleting ? 'hourglass_empty' : 'delete'}
            </span>
          </button>
          <button
            data-testid="archive-toggle-btn"
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? '折叠档案' : '展开档案'}
            className="ikb-focusring rounded-md p-1.5 transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.base; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden={true}>
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
        <div data-testid="archive-expanded" className="space-y-4">
          {/* 核心公式 */}
          <div data-testid="style-portrait-section" className="space-y-2">
            <p
              className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide"
              style={{ color: C.ikb, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
                aria-hidden={true}
              />
              {DL_SECTION_STYLE_PORTRAIT}
            </p>
            <p
              data-testid="style-portrait-body"
              className="rounded-lg border p-4 text-[14px] leading-relaxed"
              style={{ borderColor: C.line, background: `${C.ikb}06`, color: '#444653', fontFamily: F.cn }}
            >
              核心公式：{row.coreFormula}
            </p>
          </div>

          {/* 文案逻辑 placeholder */}
          <div data-testid="logic-grid-section" className="space-y-3">
            <p
              className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide"
              style={{ color: C.burgundyText, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom,${C.burgundy},${C.ikb})` }}
                aria-hidden={true}
              />
              {DL_SECTION_LOGIC}
            </p>
            <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              状态：{row.status} · 详细分析在审核完成后可见
            </p>
          </div>

          {/* 包装风格 placeholder */}
          <div data-testid="packaging-grid-section" className="space-y-3">
            <p
              className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide"
              style={{ color: C.burgundyText, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom,${C.burgundy},${C.ikb})` }}
                aria-hidden={true}
              />
              {DL_SECTION_PACKAGING}
            </p>
            <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              来源平台：{row.sourcePlatform}
            </p>
          </div>

          {/* 精华片段 placeholder */}
          <div data-testid="highlights-section" className="space-y-3">
            <p
              className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide"
              style={{ color: C.ink, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3 w-1 rounded-full"
                style={{ background: C.accent3 }}
                aria-hidden={true}
              />
              {DL_SECTION_HIGHLIGHTS_PREFIX} (0)
            </p>
            <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              文案摘要：{row.sample.slice(0, 120)}{row.sample.length > 120 ? '…' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline: EmptyArchives (IKB) ───────────────────────────────────────────────

function EmptyArchivesPioneer() {
  return (
    <div
      data-testid="empty-archives"
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center"
      style={{ borderColor: `${C.ikb}30`, background: C.base }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: `${C.ikb}10` }}
      >
        <span
          className="material-symbols-outlined text-[40px]"
          style={{ color: `${C.ikb}60` }}
          aria-hidden={true}
        >neurology</span>
      </span>
      <p className="text-[16px] font-semibold" style={{ color: '#6b7280', fontFamily: F.cn }}>{DL_EMPTY_TITLE}</p>
      <p className="text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{DL_EMPTY_DESC}</p>
    </div>
  );
}

// ── Inline: ArchiveSkeleton (IKB) ─────────────────────────────────────────────

function ArchiveSkeletonPioneer() {
  return (
    <div data-testid="archives-skeleton" className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border p-6 space-y-4 animate-pulse"
          style={{ borderColor: C.line, background: C.paper }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 rounded" style={{ background: C.line }} />
              <div className="h-4 w-1/4 rounded" style={{ background: C.base }} />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-md" style={{ background: C.line }} />
              <div className="h-8 w-8 rounded-md" style={{ background: C.line }} />
            </div>
          </div>
          <div className="h-16 rounded-lg" style={{ background: C.base }} />
        </div>
      ))}
    </div>
  );
}

// ── Inline: ArchivesError (IKB) ───────────────────────────────────────────────

function ArchivesErrorPioneer({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      data-testid="archives-error"
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-12 text-center"
      style={{ borderColor: '#fecaca', background: '#fff5f5' }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#fee2e2' }}>
        <span className="material-symbols-outlined text-[32px]" style={{ color: '#dc2626' }} aria-hidden={true}>error</span>
      </span>
      <p className="text-[15px] font-semibold" style={{ color: '#dc2626', fontFamily: F.cn }}>加载学习档案失败</p>
      <button
        type="button"
        onClick={onRetry}
        className="ikb-focusring rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
        style={{ background: '#dc2626', fontFamily: F.cn }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; }}
      >
        重试
      </button>
    </div>
  );
}

// ── Inline: UsageInstructions (IKB) ──────────────────────────────────────────

function UsageInstructionsPioneer() {
  return (
    <div
      data-testid="usage-instructions"
      className="rounded-xl border p-6 space-y-5 ikb-hovercard"
      style={{ borderColor: C.line, background: C.paper }}
    >
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${C.ikb}12`, color: C.ikb }}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>info</span>
        </span>
        <h3
          data-testid="usage-instructions-title"
          className="text-[16px] font-bold"
          style={{ color: C.ink, fontFamily: F.cn }}
        >
          {DL_USAGE_TITLE}
        </h3>
      </div>
      <div className="space-y-5">
        {DL_USAGE_SECTIONS.map((section, si) => (
          <div key={si} data-testid={`usage-section-${si}`} className="space-y-2">
            <p
              data-testid={`usage-section-title-${si}`}
              className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide"
              style={{ color: C.ikb, fontFamily: F.cn }}
            >
              <span
                className="inline-block h-3 w-1 rounded-full"
                style={{ background: `linear-gradient(to bottom,${C.ikb},${C.burgundy})` }}
                aria-hidden={true}
              />
              {section.title}
            </p>
            <ul className="space-y-1.5">
              {section.bullets.map((bullet, bi) => (
                <li
                  key={bi}
                  data-testid={`usage-bullet-${si}-${bi}`}
                  className="flex items-start gap-2 text-[13px] leading-relaxed"
                  style={{ color: '#444653', fontFamily: F.cn }}
                >
                  <span
                    className="material-symbols-outlined mt-0.5 shrink-0 text-[14px]"
                    style={{ color: `${C.ikb}80` }}
                    aria-hidden={true}
                  >chevron_right</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline: DeepLearningHeader (IKB) ─────────────────────────────────────────

function DeepLearningHeaderPioneer() {
  return (
    <header
      data-testid="deep-learning-header"
      className="mb-12 flex flex-row items-center justify-between gap-8"
    >
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <span
            className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{ borderColor: C.line, background: C.base, color: C.ink, fontFamily: F.mono }}
          >
            智能引擎
          </span>
          <span
            className="rounded-lg border px-3 py-1 text-[12px] font-bold uppercase tracking-widest"
            style={{ borderColor: `${C.ikb}40`, background: `${C.ikb}12`, color: C.ikb, fontFamily: F.mono }}
          >
            AI 训练
          </span>
        </div>
        <h1
          data-testid="deep-learning-h1"
          className="ikb-gradtext whitespace-nowrap text-[40px] font-extrabold tracking-tighter"
          style={{ fontFamily: F.display }}
        >
          {DEEP_LEARNING_H1}
        </h1>
        <p
          data-testid="deep-learning-subtitle"
          className="mt-2 max-w-[820px] text-[16px] leading-relaxed"
          style={{ color: '#444653', fontFamily: F.cn }}
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

  // ── KPI legend data (IKB 三主色轮转) ─────────────────────────────────────────
  const radarDims = [
    { label: '语料覆盖', value: 85, color: C.ikb },
    { label: '风格捕捉', value: 90, color: C.burgundy },
    { label: '语气还原', value: 88, color: C.accent3 },
    { label: '术语掌握', value: 82, color: C.ikb },
    { label: '上下文',   value: 78, color: C.burgundy },
    { label: '泛化力',   value: 86, color: C.accent3 },
  ];

  return (
    <IKBLayout>
      <main
        data-testid="deep-learning-page"
        className="space-y-8"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <DeepLearningHeaderPioneer />

        {/* ── 数据洞察 band ────────────────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ color: C.ikb }}
            aria-hidden={true}
          >insights</span>
          <h2 className="text-[16px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>AI 学习能力数据洞察</h2>
          <span className="text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>· 综合评估 · 实时测算</span>
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.cn }}
          >
            <span className="ikb-pulse h-1.5 w-1.5 rounded-full" style={{ background: C.ikb }} />
            模型已就绪
          </span>
        </div>

        {/* ── 数据洞察: 雷达 + 趋势 ───────────────────────────── */}
        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* AI 学习能力雷达 */}
          <div
            className="col-span-5 rounded-xl border p-6 ikb-hovercard"
            style={{ borderColor: C.line, background: `linear-gradient(135deg,${C.paper},${C.base})` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${C.ikb}12`, color: C.ikb }}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>radar</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>AI 学习能力雷达</h3>
                  <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>六维模型评估（模拟示意）</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-bold leading-none" style={{ color: C.ikb, fontFamily: F.display }}>86</p>
                <p className="text-[10px]" style={{ color: '#6b7280', fontFamily: F.cn }}>综合分</p>
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
                <svg viewBox="0 0 260 244" className="w-full">
                  <defs>
                    <linearGradient id="dl-radarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.38" />
                      <stop offset="100%" stopColor={C.burgundy} stopOpacity="0.12" />
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
                    return <circle key={i} cx={x} cy={y} r="3.2" fill="#fff" stroke={d.color} strokeWidth="2" />;
                  })}
                  {radarDims.map((d, i) => {
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
              {radarDims.map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>{d.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: C.ink, fontFamily: F.mono }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 训练样本积累趋势 */}
          <div
            className="col-span-7 rounded-xl border p-6 ikb-hovercard"
            style={{ borderColor: C.line, background: `linear-gradient(135deg,${C.paper},${C.base})` }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${C.burgundy}12`, color: C.burgundy }}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>show_chart</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: C.ink, fontFamily: F.cn }}>训练样本积累</h3>
                  <p className="text-[11px]" style={{ color: '#6b7280', fontFamily: F.cn }}>按当前学习档案测算</p>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold"
                style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.cn }}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden={true}>trending_up</span>+86%
              </span>
            </div>
            <div className="mb-3 flex items-end gap-3">
              <p className="text-[30px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>{archives.length}</p>
              <span className="mb-1 text-[13px]" style={{ color: '#6b7280', fontFamily: F.cn }}>份学习档案 · 持续积累中</span>
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
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                  <defs>
                    <linearGradient id="dl-trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.ikb} stopOpacity="0.24" />
                      <stop offset="100%" stopColor={C.ikb} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="dl-trendLine" x1="0" y1="0" x2="1" y2="0">
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
                  <path d={area} fill="url(#dl-trendFill)" />
                  <path d={line} fill="none" stroke="url(#dl-trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) =>
                    i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke={C.ikb} strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div className="mt-1 flex justify-between px-1 text-[10px]" style={{ color: '#6b7280', fontFamily: F.cn }}>
              {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI 卡一排(4 卡) ────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          {/* 档案数 · 蓝 */}
          <div
            className="rounded-xl border p-5 ikb-hovercard"
            style={{ borderColor: `${C.ikb}28`, background: `linear-gradient(135deg,${C.paper},${C.base})` }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>folder_open</span>
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.cn }}
              >
                <span className="material-symbols-outlined text-[13px]" aria-hidden={true}>trending_up</span>+1
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                  {archives.length}<span className="text-[15px]" style={{ color: '#6b7280' }}> 份</span>
                </p>
                <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>学习档案</p>
              </div>
              <div className="h-12 w-12 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={`${C.ikb}18`} strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke={C.ikb} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${Math.min(100, archives.length * 25)} 100`} />
                </svg>
              </div>
            </div>
          </div>

          {/* 样本数 · 玫红 */}
          <div
            className="rounded-xl border p-5 ikb-hovercard"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.burgundy}12`, color: C.burgundy }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>article</span>
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${C.burgundy}12`, color: C.burgundyText, fontFamily: F.cn }}
              >已分析</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                {archives.length + samples.length}
                <span className="text-[15px]" style={{ color: '#6b7280' }}> 篇</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>文案样本</p>
            </div>
            <div className="mt-3 flex h-6 items-end gap-1">
              {[48, 80, 65, 92, 74].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%`, background: `${C.burgundy}70` }}
                />
              ))}
            </div>
          </div>

          {/* 训练进度 · 紫 */}
          <div
            className="rounded-xl border p-5 ikb-hovercard"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.accent3}14`, color: C.purpleText }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>model_training</span>
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${C.accent3}14`, color: C.purpleText, fontFamily: F.cn }}
              >模拟示意</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                —<span className="text-[15px]" style={{ color: '#6b7280' }}>%</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>训练进度</p>
            </div>
            <div className="mt-3 h-2 w-full rounded-full" style={{ background: `${C.accent3}18` }}>
              <div
                className="h-2 w-1/2 rounded-full"
                style={{ background: `linear-gradient(to right,${C.accent3},${C.ikb})` }}
              />
            </div>
          </div>

          {/* 模型版本 · 蓝 */}
          <div
            className="rounded-xl border p-5 ikb-hovercard"
            style={{ borderColor: C.line, background: C.paper }}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${C.ikb}12`, color: C.ikb }}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden={true}>smart_toy</span>
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ background: `${C.ikb}12`, color: C.ikb, fontFamily: F.cn }}
              >最新</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none" style={{ color: C.ink, fontFamily: F.display }}>
                v1<span className="text-[15px]" style={{ color: '#6b7280' }}>.0</span>
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: '#6b7280', fontFamily: F.cn }}>模型版本</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {['风格分析', '逻辑提取'].map((k) => (
                <span
                  key={k}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: `${C.ikb}10`, color: C.ikb, fontFamily: F.cn }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 样本表单 ─────────────────────────────────────────── */}
        <SampleFormPioneer
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

        {/* ── 档案区 ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2
            data-testid="archives-heading"
            className="text-[20px] font-extrabold tracking-tight"
            style={{ color: C.ink, fontFamily: F.cn }}
          >
            {DL_ARCHIVES_TITLE_PREFIX}
            <span className="ml-2 text-[16px] font-normal" style={{ color: '#6b7280' }}>({archives.length})</span>
          </h2>

          {isListLoading && <ArchiveSkeletonPioneer />}

          {isListError && !isListLoading && (
            <ArchivesErrorPioneer onRetry={() => void refetchList()} />
          )}

          {!isListLoading && !isListError && archives.length === 0 && (
            <EmptyArchivesPioneer />
          )}

          {!isListLoading && !isListError && archives.length > 0 && (
            archives.map((row) => (
              <QueueArchiveCardPioneer
                key={row.id}
                row={row}
                onDelete={handleDelete}
                isDeletePending={deleteMutation.isPending}
                deletingId={deletingId}
              />
            ))
          )}
        </div>

        {/* ── 使用说明 ─────────────────────────────────────────── */}
        <UsageInstructionsPioneer />
      </main>
    </IKBLayout>
  );
}
