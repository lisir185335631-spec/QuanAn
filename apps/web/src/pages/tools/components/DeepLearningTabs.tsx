/**
 * DeepLearningTabs.tsx — PRD-15 US-003
 * 3 tabs: 学习 / 我的库 / 公式应用
 * AC-2/3/4: tab content components used by DeepLearning.tsx
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
    <div className="space-y-4 max-w-2xl" data-testid="learn-tab">
      <div className="space-y-2">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-label-sm font-label text-on-surface-variant">来源平台</label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-48 bg-surface-variant/20" data-testid="platform-select">
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

      <div className="space-y-2">
        <label htmlFor="dlt-sample" className="text-label-sm font-label text-on-surface-variant">
          粘贴优秀文案（≥100 字）
        </label>
        <textarea
          id="dlt-sample"
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder="粘贴您想学习的文案内容…"
          rows={8}
          className="w-full rounded-md border border-outline-variant bg-surface-variant/20 px-3 py-2 text-body-md text-on-surface resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          data-testid="sample-textarea"
        />
        <p className="text-label-xs text-on-surface-variant">{sample.length} 字</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={parseMutation.isPending || sample.length < 100}
        data-testid="parse-submit-btn"
      >
        {parseMutation.isPending ? '解析中…' : '开始深度解析'}
      </Button>

      {analysis && (
        <Card className="border-primary/20 bg-surface-variant/10" data-testid="parse-result">
          <CardHeader>
            <span className="text-label-sm font-label text-primary uppercase tracking-wide">
              解析结果
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-label-xs text-on-surface-variant">核心公式</p>
                <p className="text-body-sm text-on-surface font-medium" data-testid="core-formula">
                  {analysis.coreFormula}
                </p>
              </div>
              <div>
                <p className="text-label-xs text-on-surface-variant">钩子类型</p>
                <p className="text-body-sm text-on-surface" data-testid="hook-type">
                  {analysis.hookType}
                </p>
              </div>
              <div>
                <p className="text-label-xs text-on-surface-variant">结构模式</p>
                <p className="text-body-sm text-on-surface" data-testid="structure-pattern">
                  {analysis.structurePattern}
                </p>
              </div>
              <div>
                <p className="text-label-xs text-on-surface-variant">情绪弧线</p>
                <p className="text-body-sm text-on-surface" data-testid="emotional-arc">
                  {analysis.emotionalArc}
                </p>
              </div>
            </div>
            {analysis.keywords.length > 0 && (
              <div>
                <p className="text-label-xs text-on-surface-variant mb-1">关键词</p>
                <div className="flex flex-wrap gap-1" data-testid="keywords-list">
                  {analysis.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSaveToLibrary}
                data-testid="save-to-library-btn"
              >
                保存到我的库
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleApply}
                data-testid="apply-to-copywriting-btn"
              >
                应用到文案生成
              </Button>
            </div>
          </CardContent>
        </Card>
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
      <p className="text-body-md text-muted-foreground py-8 text-center" data-testid="library-loading">
        加载中…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="library-empty">
        <p className="text-body-md text-on-surface-variant">暂无学习记录</p>
        <p className="text-body-sm text-muted-foreground mt-1">
          在「学习」标签页提交文案后，记录将出现在这里
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh]" data-testid="library-table">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-outline-variant text-label-xs text-on-surface-variant">
            <th className="pb-2 text-left font-label w-2/5">文案摘要</th>
            <th className="pb-2 text-left font-label">公式名</th>
            <th className="pb-2 text-left font-label">平台</th>
            <th className="pb-2 text-left font-label">学习时间</th>
            <th className="pb-2 text-left font-label">操作</th>
          </tr>
        </thead>
        <tbody>
          {(items as QueueItem[]).map((item) => (
            <tr
              key={item.id}
              className="border-b border-outline-variant/30 hover:bg-surface-variant/10"
              data-testid={`library-row-${item.id}`}
            >
              <td className="py-2 pr-4 text-on-surface">
                {item.sample.slice(0, 80)}
                {item.sample.length > 80 ? '…' : ''}
              </td>
              <td className="py-2 pr-4 text-on-surface-variant">{item.coreFormula}</td>
              <td className="py-2 pr-4 text-on-surface-variant">{item.sourcePlatform}</td>
              <td className="py-2 pr-4 text-on-surface-variant">
                {new Date(item.createdAt).toLocaleDateString('zh-CN')}
              </td>
              <td className="py-2">
                <div className="flex gap-2">
                  <button
                    className="text-primary text-xs hover:underline"
                    onClick={() => onApply(item)}
                    data-testid={`apply-btn-${item.id}`}
                  >
                    应用
                  </button>
                  <button
                    className="text-destructive text-xs hover:underline"
                    onClick={() => deleteMutation.mutate({ archiveId: item.id })}
                    data-testid={`delete-btn-${item.id}`}
                    disabled={deleteMutation.isPending}
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
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

  return (
    <div className="space-y-4 max-w-2xl" data-testid="apply-formula-tab">
      <div className="space-y-2">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-label-sm font-label text-on-surface-variant">选择公式</label>
        {(items as QueueItem[]).length === 0 ? (
          <p className="text-body-sm text-muted-foreground">暂无学习记录，请先在「学习」标签提交文案</p>
        ) : (
          <Select
            value={selectedQueueId}
            onValueChange={setSelectedQueueId}
          >
            <SelectTrigger
              className="w-full bg-surface-variant/20"
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

      <div className="space-y-2">
        <label htmlFor="dlt-new-topic" className="text-label-sm font-label text-on-surface-variant">新主题</label>
        <input
          id="dlt-new-topic"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="输入您想要创作的主题…"
          className="w-full rounded-md border border-outline-variant bg-surface-variant/20 px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          data-testid="new-topic-input"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={applyMutation.isPending || !selectedQueueId || !newTopic.trim()}
        data-testid="generate-btn"
      >
        {applyMutation.isPending ? '生成中…' : '用公式生成文案'}
      </Button>

      {result && (
        <Card className="border-primary/20 bg-surface-variant/10" data-testid="formula-result">
          <CardHeader>
            <span className="text-label-sm font-label text-primary uppercase tracking-wide">
              生成结果
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-on-surface whitespace-pre-wrap">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
