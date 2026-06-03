/**
 * DeepLearning.tsx — /deep-learning · 先锋白 · 1:1 复刻 aiipznt.vip/deep-learning
 * 阶段2 phase-2: 接真 trpc.deepLearning.* (list/parse/delete/applyFormula/createFromFile/learn/learnStatus)
 * 逻辑/testid 零回退 · 先锋白皮 · 5 组件 inline 重写
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { PioneerLayout } from '@/layouts/PioneerLayout';
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

// ── Inline: SampleForm (先锋白) ───────────────────────────────────────────────

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
      className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7faff] p-6 pw-shadow-soft"
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#002fa7]/[0.05] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-[#781621]/[0.04] blur-2xl" />

      {/* card header */}
      <div className="relative mb-6 flex items-center gap-3 border-b border-[#eef1f6] pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#002fa7] to-[#3654c8] text-white shadow-lg shadow-[#002fa7]/25">
          <span className="material-symbols-outlined" aria-hidden="true">psychology</span>
        </span>
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">添加文案样本</h2>
          <p className="text-[12px] text-[#9ca3af]">上传文件或粘贴文案 · AI 风格解析</p>
        </div>
      </div>

      <div className="relative space-y-5">
        {/* 2 tab */}
        <div className="grid grid-cols-2 gap-3">
          <button
            data-testid="tab-upload"
            type="button"
            onClick={() => handleTabClick('upload')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'border-[#002fa7] bg-[#002fa7] text-white'
                : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#002fa7]/40 hover:bg-[#f8faff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">upload_file</span>
            {DL_TAB_UPLOAD}
          </button>
          <button
            data-testid="tab-paste"
            type="button"
            onClick={() => handleTabClick('paste')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              activeTab === 'paste'
                ? 'border-[#002fa7] bg-[#002fa7] text-white'
                : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#002fa7]/40 hover:bg-[#f8faff]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              aria-hidden="true"
            >
              description
            </span>
            {DL_TAB_PASTE}
          </button>
        </div>

        {/* ── Upload tab content ── */}
        {activeTab === 'upload' && (
          <div data-testid="upload-tab-content" className="space-y-4">
            <div className="rounded-lg border border-[#e5e7eb] bg-[#fffbeb] p-3 text-[12px] text-[#8a6a00]">
              文件上传暂用文件链接提交（S3 直传 PRD-7 上线后启用）
            </div>
            <div>
              <label
                htmlFor="dl-file-url"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                文件 URL
              </label>
              <input
                id="dl-file-url"
                data-testid="file-url-input"
                type="url"
                placeholder="https://example.com/your-file.pdf"
                value={fileUrl}
                onChange={(e) => onFileUrlChange(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] px-4 py-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
              />
            </div>
            <div className="flex justify-end">
              <button
                data-testid="file-submit-btn"
                type="button"
                disabled={!fileUrl.trim() || isFilePending}
                onClick={onFileSubmit}
                className="flex items-center gap-2 rounded-lg bg-[#002fa7] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#001e73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">upload</span>
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
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#002fa7] hover:opacity-80"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add_circle</span>
                {DL_ADD_SAMPLE_LABEL}
              </button>
              <button
                data-testid="batch-paste-btn"
                type="button"
                onClick={handleBatchPaste}
                className="text-[13px] font-semibold text-[#002fa7] hover:opacity-80"
              >
                {DL_BATCH_PASTE}
              </button>
            </div>

            {/* 来源平台 */}
            <div>
              <label
                htmlFor="dl-platform"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                来源平台
              </label>
              <select
                id="dl-platform"
                data-testid="platform-select"
                value={sourcePlatform}
                onChange={(e) => onSourcePlatformChange(e.target.value)}
                className="w-48 rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] px-3 py-2.5 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
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
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                粘贴文案内容
              </label>
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9f9f9] transition-all focus-within:border-[#002fa7] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#002fa7]">
                <textarea
                  id="dl-textarea"
                  data-testid="dl-textarea"
                  placeholder={DL_TEXTAREA_PLACEHOLDER}
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  rows={5}
                  maxLength={TEXT_MAX}
                  className="w-full resize-none border-0 bg-transparent p-4 text-[14px] leading-relaxed outline-none"
                />
                <div className="flex items-center justify-between gap-3 border-t border-[#eef1f6] bg-white/60 px-4 py-2.5">
                  <span
                    data-testid="ctrl-enter-hint"
                    className="text-[11px] text-[#9ca3af]"
                  >
                    {DL_HINT_CTRL_ENTER}
                  </span>
                  <span className={`shrink-0 text-[11px] tabular-nums ${isTextTooLong ? 'text-[#dc2626]' : 'text-[#9ca3af]'}`}>
                    {text.length} 字
                  </span>
                </div>
              </div>
              {text.length > 0 && text.length < TEXT_MIN_PARSE && (
                <p data-testid="text-length-warning" className="mt-1.5 text-[12px] text-[#dc2626]">
                  文案需不少于 100 字（当前 {text.length} 字）
                </p>
              )}
              {isTextTooLong && (
                <p data-testid="text-too-long-warning" className="mt-1.5 text-[12px] text-[#dc2626]">
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
                className="flex items-center gap-2 rounded-lg border border-[#002fa7] px-4 py-2 text-[13px] font-semibold text-[#002fa7] transition-all hover:bg-[#002fa7] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                {DL_ADD_THIS_BTN}
              </button>
            </div>

            {/* 已收集样本列表 */}
            {samples.length > 0 && (
              <div data-testid="collected-samples" className="space-y-2 rounded-lg border border-[#e0e7ff] bg-[#f8faff] p-3">
                <p className="text-[12px] font-semibold text-[#002fa7]">已收集 {samples.length} 篇样本</p>
                {samples.map((s, i) => (
                  <div
                    key={i}
                    data-testid={`collected-sample-${i}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 py-2"
                  >
                    <span className="flex-1 truncate text-[13px] text-[#444653]">
                      {s.source} · {s.text.slice(0, 30)}{s.text.length > 30 ? '…' : ''}
                    </span>
                    <button
                      data-testid={`remove-sample-${i}`}
                      type="button"
                      onClick={() => onRemoveSample(i)}
                      className="shrink-0 rounded p-1 text-[#781621] hover:bg-[#781621]/10"
                      aria-label="移除"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 学习档案名称 input */}
            <div>
              <label
                htmlFor="dl-archive-name"
                className="mb-2 flex items-center gap-1.5 text-[14px] font-extrabold tracking-wide text-[#1b1b1b] before:h-3.5 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
              >
                学习档案名称
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#9ca3af]" aria-hidden="true">folder</span>
                <input
                  id="dl-archive-name"
                  data-testid="archive-name-input"
                  type="text"
                  placeholder={DL_NAME_PLACEHOLDER}
                  value={archiveName}
                  onChange={(e) => onArchiveNameChange(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9f9f9] py-3 pl-10 pr-3 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:bg-white focus:ring-1 focus:ring-[#002fa7]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#9ca3af]">
                已添加 {sampleCount} 篇文案样本
              </p>
            </div>

            {/* 批量学习任务状态 */}
            {learnJobId && learnJobStatus && (
              <div data-testid="learn-job-status" className="rounded-lg border border-[#e0e7ff] bg-[#f8faff] px-4 py-3">
                <p className="text-[13px] text-[#002fa7]">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002fa7] px-8 py-3.5 text-[12px] font-bold uppercase tracking-widest text-white pw-shadow-soft transition-all hover:bg-[#001e73] active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">neurology</span>
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
          <div data-testid="parse-result" className="rounded-xl border border-[#e0e7ff] bg-[#f8faff] p-5 space-y-4">
            <p className="text-[13px] font-extrabold tracking-wide text-[#002fa7] flex items-center gap-1.5 before:h-3 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
              解析结果
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">核心公式</p>
                <p data-testid="parse-core-formula" className="text-[13px] text-[#1b1b1b]">{parseAnalysis.coreFormula}</p>
              </div>
              <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">钩子类型</p>
                <p data-testid="parse-hook-type" className="text-[13px] text-[#1b1b1b]">{parseAnalysis.hookType}</p>
              </div>
              <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">结构模式</p>
                <p data-testid="parse-structure-pattern" className="text-[13px] text-[#1b1b1b]">{parseAnalysis.structurePattern}</p>
              </div>
              <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af]">情绪弧线</p>
                <p data-testid="parse-emotional-arc" className="text-[13px] text-[#1b1b1b]">{parseAnalysis.emotionalArc}</p>
              </div>
            </div>
            {parseAnalysis.keywords.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#9ca3af] mb-1">关键词</p>
                <div className="flex flex-wrap gap-1" data-testid="parse-keywords">
                  {parseAnalysis.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-[#002fa7]/10 px-2 py-0.5 text-xs font-medium text-[#002fa7]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 应用公式 */}
            {parsedQueueId !== null && (
              <div data-testid="apply-formula-section" className="space-y-3 pt-2 border-t border-[#eef1f6]">
                <p className="text-[13px] font-extrabold tracking-wide text-[#781621]">用此公式生成文案</p>
                <input
                  data-testid="apply-topic-input"
                  aria-label="新主题"
                  type="text"
                  maxLength={500}
                  placeholder="输入新主题，如：护肤品推广、健身打卡…"
                  value={applyTopic}
                  onChange={(e) => setApplyTopic(e.target.value)}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[14px] outline-none transition-all focus:border-[#002fa7] focus:ring-1 focus:ring-[#002fa7]"
                />
                {applyTopic.length > 500 && (
                  <p className="text-[12px] text-[#dc2626]">主题不能超过 500 字</p>
                )}
                <button
                  data-testid="apply-formula-btn"
                  type="button"
                  disabled={isApplyPending || !applyTopic.trim() || applyTopic.length > 500}
                  onClick={() => onApplyFormula(parsedQueueId, applyTopic)}
                  className="flex items-center gap-2 rounded-lg bg-[#781621] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#5a1019] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">auto_awesome</span>
                  {isApplyPending ? '生成中…' : '用公式生成'}
                </button>
                {applyContent && (
                  <div data-testid="apply-formula-result" className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-[14px] leading-relaxed text-[#1b1b1b] whitespace-pre-wrap">
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

// ── Archive status chip (先锋白) ──────────────────────────────────────────────

function ArchiveStatusChip({ status }: { status: string }) {
  const label = getDLArchiveStatusLabel(status);
  let colorClass =
    'bg-[#f3f4f6] text-[#6b7280]'; // default / unknown
  let dotClass = 'bg-[#6b7280]';

  if (status === 'approved') {
    colorClass = 'bg-[#10b981]/10 text-[#10b981]';
    dotClass = 'bg-[#10b981]';
  } else if (status === 'pending') {
    colorClass = 'bg-[#F6D300]/20 text-[#8a6a00]';
    dotClass = 'bg-[#F6D300]';
  } else if (status === 'rejected') {
    colorClass = 'bg-[#dc2626]/10 text-[#dc2626]';
    dotClass = 'bg-[#dc2626]';
  } else if (status === 'cancelled') {
    colorClass = 'bg-[#e5e7eb] text-[#9ca3af]';
    dotClass = 'bg-[#9ca3af]';
  }

  return (
    <span
      data-testid="archive-done-chip"
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${colorClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

// ── Inline: QueueArchiveCard (先锋白) — wraps a QueueRow ──────────────────────

interface QueueArchiveCardProps {
  row: QueueRow;
  onDelete: (id: number) => void;
  isDeletePending: boolean;
  deletingId: number | null;
}

function QueueArchiveCardPioneer({ row, onDelete, isDeletePending, deletingId }: QueueArchiveCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isDeleting = isDeletePending && deletingId === row.id;

  function handleCopy() {
    toast.success(DL_TOAST_COPY);
  }

  function handleDelete() {
    if (isDeleting) return;
    if (!window.confirm('确认删除此学习档案？')) return;
    onDelete(row.id);
  }

  const createdDateStr = row.createdAt
    ? new Date(row.createdAt).toLocaleDateString('zh-CN')
    : '';

  return (
    <div
      data-testid={`archive-card-${row.id}`}
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft space-y-6"
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              data-testid="archive-title"
              className="text-[16px] font-bold text-[#111827]"
            >
              {row.sample.slice(0, 40)}{row.sample.length > 40 ? '…' : ''}
            </h3>
            <ArchiveStatusChip status={row.status} />
          </div>
          <p
            data-testid="archive-subtitle"
            className="flex items-center gap-1 text-[12px] text-[#9ca3af]"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">description</span>
            {row.sourcePlatform} · {createdDateStr}
          </p>
        </div>

        {/* action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            data-testid="archive-copy-btn"
            type="button"
            onClick={handleCopy}
            aria-label="复制"
            className="rounded-md p-1.5 text-[#002fa7] transition-colors hover:bg-[#002fa7]/10"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
          </button>
          <button
            data-testid="archive-delete-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="删除"
            className="rounded-md p-1.5 text-[#781621] transition-colors hover:bg-[#781621]/10 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {isDeleting ? 'hourglass_empty' : 'delete'}
            </span>
          </button>
          <button
            data-testid="archive-toggle-btn"
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? '折叠' : '展开'}
            className="rounded-md p-1.5 text-[#9ca3af] transition-colors hover:bg-[#f1f3f9]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* expanded content */}
      {expanded && (
        <div data-testid="archive-expanded" className="space-y-4">
          {/* 核心公式 */}
          <div data-testid="style-portrait-section" className="space-y-2">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#002fa7] before:h-3 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']">
              {DL_SECTION_STYLE_PORTRAIT}
            </p>
            <p
              data-testid="style-portrait-body"
              className="rounded-lg border border-[#e5e7eb] bg-[#f8faff] p-4 text-[14px] leading-relaxed text-[#444653]"
            >
              核心公式：{row.coreFormula}
            </p>
          </div>

          {/* 文案逻辑 placeholder */}
          <div data-testid="logic-grid-section" className="space-y-3">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#781621] before:h-3 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#781621] before:to-[#002fa7] before:content-['']">
              {DL_SECTION_LOGIC}
            </p>
            <p className="text-[13px] text-[#9ca3af]">
              状态：{row.status} · 详细分析在审核完成后可见
            </p>
          </div>

          {/* 包装风格 placeholder */}
          <div data-testid="packaging-grid-section" className="space-y-3">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#781621] before:h-3 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#781621] before:to-[#002fa7] before:content-['']">
              {DL_SECTION_PACKAGING}
            </p>
            <p className="text-[13px] text-[#9ca3af]">
              来源平台：{row.sourcePlatform}
            </p>
          </div>

          {/* 精华片段 placeholder */}
          <div data-testid="highlights-section" className="space-y-3">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#111827] before:h-3 before:w-1 before:rounded-full before:bg-[#F6D300] before:content-['']">
              {DL_SECTION_HIGHLIGHTS_PREFIX} (0)
            </p>
            <p className="text-[13px] text-[#9ca3af]">
              文案摘要：{row.sample.slice(0, 120)}{row.sample.length > 120 ? '…' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline: EmptyArchives (先锋白) ────────────────────────────────────────────

function EmptyArchivesPioneer() {
  return (
    <div
      data-testid="empty-archives"
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] py-16 text-center"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f3f9]">
        <span className="material-symbols-outlined text-[40px] text-[#c7d2fe]" aria-hidden="true">neurology</span>
      </span>
      <p className="text-[16px] font-semibold text-[#6b7280]">{DL_EMPTY_TITLE}</p>
      <p className="text-[13px] text-[#9ca3af]">{DL_EMPTY_DESC}</p>
    </div>
  );
}

// ── Inline: ArchiveSkeleton (先锋白) ─────────────────────────────────────────

function ArchiveSkeletonPioneer() {
  return (
    <div data-testid="archives-skeleton" className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft space-y-4 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/3 rounded bg-[#e5e7eb]" />
              <div className="h-4 w-1/4 rounded bg-[#f3f4f6]" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-md bg-[#e5e7eb]" />
              <div className="h-8 w-8 rounded-md bg-[#e5e7eb]" />
            </div>
          </div>
          <div className="h-16 rounded-lg bg-[#f3f4f6]" />
        </div>
      ))}
    </div>
  );
}

// ── Inline: ArchivesError (先锋白) ────────────────────────────────────────────

function ArchivesErrorPioneer({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      data-testid="archives-error"
      className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-[#fecaca] bg-[#fff5f5] py-12 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fee2e2]">
        <span className="material-symbols-outlined text-[32px] text-[#dc2626]" aria-hidden="true">error</span>
      </span>
      <p className="text-[15px] font-semibold text-[#dc2626]">加载学习档案失败</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-[#dc2626] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#b91c1c]"
      >
        重试
      </button>
    </div>
  );
}

// ── Inline: UsageInstructions (先锋白) ────────────────────────────────────────

function UsageInstructionsPioneer() {
  return (
    <div
      data-testid="usage-instructions"
      className="rounded-xl border border-[#e5e7eb] bg-white p-6 pw-shadow-soft space-y-5"
    >
      <div className="flex items-center gap-3 border-b border-[#eef1f6] pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">info</span>
        </span>
        <h3
          data-testid="usage-instructions-title"
          className="text-[16px] font-bold text-[#111827]"
        >
          {DL_USAGE_TITLE}
        </h3>
      </div>
      <div className="space-y-5">
        {DL_USAGE_SECTIONS.map((section, si) => (
          <div key={si} data-testid={`usage-section-${si}`} className="space-y-2">
            <p
              data-testid={`usage-section-title-${si}`}
              className="flex items-center gap-1.5 text-[13px] font-extrabold tracking-wide text-[#002fa7] before:h-3 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-[#002fa7] before:to-[#781621] before:content-['']"
            >
              {section.title}
            </p>
            <ul className="space-y-1.5">
              {section.bullets.map((bullet, bi) => (
                <li
                  key={bi}
                  data-testid={`usage-bullet-${si}-${bi}`}
                  className="flex items-start gap-2 text-[13px] leading-relaxed text-[#444653]"
                >
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[14px] text-[#c7d2fe]" aria-hidden="true">chevron_right</span>
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

// ── Inline: DeepLearningHeader (先锋白) ───────────────────────────────────────

function DeepLearningHeaderPioneer() {
  return (
    <header
      data-testid="deep-learning-header"
      className="mb-12 flex flex-row items-center justify-between gap-8"
    >
      <div className="shrink-0">
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-lg border border-[#e5e7eb] bg-[#e8e8e8] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#1b1b1b]">
            智能引擎
          </span>
          <span className="rounded-lg border border-[#6e5e00] bg-[#F6D300] px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-[#221b00]">
            AI 训练
          </span>
        </div>
        <h1
          data-testid="deep-learning-h1"
          className="whitespace-nowrap text-[40px] font-extrabold tracking-tighter text-[#1b1b1b]"
        >
          {DEEP_LEARNING_H1}
        </h1>
        <p
          data-testid="deep-learning-subtitle"
          className="mt-2 max-w-[820px] text-[16px] leading-relaxed text-[#444653]"
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

  return (
    <PioneerLayout>
      <main
        data-testid="deep-learning-page"
        className="space-y-8"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <DeepLearningHeaderPioneer />

        {/* ── 数据洞察 band ────────────────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#002fa7]" aria-hidden="true">insights</span>
          <h2 className="text-[16px] font-bold text-[#111827]">AI 学习能力数据洞察</h2>
          <span className="text-[12px] text-[#9ca3af]">· 综合评估 · 实时测算</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/10 px-3 py-1 text-[12px] font-semibold text-[#10b981]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10b981]" />
            模型已就绪
          </span>
        </div>

        {/* ── 数据洞察: 雷达 + 趋势 ───────────────────────────── */}
        <div className="mb-8 grid grid-cols-12 gap-6">
          {/* AI 学习能力雷达 */}
          <div className="col-span-5 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f5f8ff] p-6 pw-shadow-soft">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">radar</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">AI 学习能力雷达</h3>
                  <p className="text-[11px] text-[#9ca3af]">六维模型评估（模拟示意）</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[26px] font-bold leading-none text-[#002fa7]">86</p>
                <p className="text-[10px] text-[#9ca3af]">综合分</p>
              </div>
            </div>
            {(() => {
              const dims = [
                { label: '语料覆盖', value: 85, color: '#002fa7' },
                { label: '风格捕捉', value: 90, color: '#781621' },
                { label: '语气还原', value: 88, color: '#F6D300' },
                { label: '术语掌握', value: 82, color: '#002fa7' },
                { label: '上下文', value: 78, color: '#781621' },
                { label: '泛化力', value: 86, color: '#F6D300' },
              ];
              const cx = 130;
              const cy = 122;
              const R = 88;
              const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
              const pt = (i: number, r: number): [number, number] => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
              const poly = (r: number) => dims.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ');
              const dataPoly = dims.map((d, i) => pt(i, R * (d.value / 100)).map((n) => n.toFixed(1)).join(',')).join(' ');
              return (
                <svg viewBox="0 0 260 244" className="w-full">
                  <defs>
                    <linearGradient id="radarFillDL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002fa7" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#781621" stopOpacity="0.12" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <polygon key={f} points={poly(R * f)} fill="none" stroke="#e8ebf2" strokeWidth="1" />
                  ))}
                  {dims.map((_, i) => {
                    const [x, y] = pt(i, R);
                    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#eef1f6" strokeWidth="1" />;
                  })}
                  <polygon points={dataPoly} fill="url(#radarFillDL)" stroke="#002fa7" strokeWidth="2" strokeLinejoin="round" />
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
              {[
                { label: '语料覆盖', value: 85, color: '#002fa7' },
                { label: '风格捕捉', value: 90, color: '#781621' },
                { label: '语气还原', value: 88, color: '#F6D300' },
                { label: '术语掌握', value: 82, color: '#002fa7' },
                { label: '上下文', value: 78, color: '#781621' },
                { label: '泛化力', value: 86, color: '#F6D300' },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-[#6b7280]">{d.label}</span>
                  <span className="text-[11px] font-bold text-[#111827]">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 训练样本积累趋势 */}
          <div className="col-span-7 rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-white to-[#f7f5ff] p-6 pw-shadow-soft">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">show_chart</span>
                </span>
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">训练样本积累</h3>
                  <p className="text-[11px] text-[#9ca3af]">按当前学习档案测算</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[12px] font-bold text-[#10b981]">
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">trending_up</span>+86%
              </span>
            </div>
            <div className="mb-3 flex items-end gap-3">
              <p className="text-[30px] font-bold leading-none text-[#111827]">{archives.length}</p>
              <span className="mb-1 text-[13px] text-[#9ca3af]">份学习档案 · 持续积累中</span>
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
                    <linearGradient id="trendFillDL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002fa7" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#002fa7" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="trendLineDL" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#002fa7" />
                      <stop offset="100%" stopColor="#781621" />
                    </linearGradient>
                  </defs>
                  {[0, 0.33, 0.66, 1].map((f) => (
                    <line
                      key={f}
                      x1={padL}
                      x2={W - padR}
                      y1={(padT + innerH * f).toFixed(1)}
                      y2={(padT + innerH * f).toFixed(1)}
                      stroke="#f1f3f9"
                      strokeWidth="1"
                    />
                  ))}
                  <path d={area} fill="url(#trendFillDL)" />
                  <path d={line} fill="none" stroke="url(#trendLineDL)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((v, i) =>
                    i % 3 === 0 ? <circle key={i} cx={x(i)} cy={y(v)} r="3.4" fill="#fff" stroke="#002fa7" strokeWidth="2" /> : null,
                  )}
                </svg>
              );
            })()}
            <div className="mt-1 flex justify-between px-1 text-[10px] text-[#9ca3af]">
              {['第1周', '第3周', '第5周', '第7周', '第9周', '第12周'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI 卡一排(4 卡) ────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-4 gap-6">
          {/* 档案数 · 蓝 */}
          <div className="rounded-xl border border-[#e0e7ff] bg-gradient-to-br from-white to-[#f3f6ff] p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">folder_open</span>
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[11px] font-bold text-[#10b981]">
                <span className="material-symbols-outlined text-[13px]" aria-hidden="true">trending_up</span>+1
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[28px] font-bold leading-none text-[#111827]">
                  {archives.length}<span className="text-[15px] text-[#9ca3af]"> 份</span>
                </p>
                <p className="mt-1.5 text-[12px] text-[#6b7280]">学习档案</p>
              </div>
              <div className="h-12 w-12 shrink-0">
                <svg viewBox="0 0 36 36" className="-rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eef2ff" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#002fa7" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${Math.min(100, archives.length * 25)} 100`} />
                </svg>
              </div>
            </div>
          </div>

          {/* 样本数 · 勃艮第 — 用真实列表数 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#781621]/10 text-[#781621]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">article</span>
              </span>
              <span className="rounded-full bg-[#781621]/10 px-2 py-0.5 text-[11px] font-bold text-[#781621]">已分析</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                {archives.length + samples.length}
                <span className="text-[15px] text-[#9ca3af]"> 篇</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">文案样本</p>
            </div>
            <div className="mt-3 flex h-6 items-end gap-1">
              {[48, 80, 65, 92, 74].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-[#781621]/70" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* 训练进度 · 黄 — 软化为模拟示意 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F6D300]/20 text-[#8a6a00]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">model_training</span>
              </span>
              <span className="rounded-full bg-[#F6D300]/20 px-2 py-0.5 text-[11px] font-bold text-[#8a6a00]">模拟示意</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                —<span className="text-[15px] text-[#9ca3af]">%</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">训练进度</p>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[#fdf6cc]">
              <div className="h-2 w-1/2 rounded-full bg-gradient-to-r from-[#F6D300] to-[#ffe45c]" />
            </div>
          </div>

          {/* 模型版本 · 蓝 */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 pw-shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#002fa7]/10 text-[#002fa7]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">smart_toy</span>
              </span>
              <span className="rounded-full bg-[#002fa7]/10 px-2 py-0.5 text-[11px] font-bold text-[#002fa7]">最新</span>
            </div>
            <div className="mt-4">
              <p className="text-[28px] font-bold leading-none text-[#111827]">
                v1<span className="text-[15px] text-[#9ca3af]">.0</span>
              </p>
              <p className="mt-1.5 text-[12px] text-[#6b7280]">模型版本</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {['风格分析', '逻辑提取'].map((k) => (
                <span key={k} className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[10px] font-medium text-[#002fa7]">
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
            className="text-[20px] font-extrabold tracking-tight text-[#111827]"
          >
            {DL_ARCHIVES_TITLE_PREFIX}
            <span className="ml-2 text-[16px] font-normal text-[#9ca3af]">({archives.length})</span>
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
    </PioneerLayout>
  );
}
