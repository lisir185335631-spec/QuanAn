/**
 * DeepLearning.tsx — /tools/deep-learning · PRD-27 US-004
 * AC-5: textarea + '添加这篇' → samples state · '开始深度学习' → learn mutation
 * AC-6: result.summary + 5维度(tone/structure/hook/transition/closing) · spinner · error toast
 * AC-7: file upload 不在 P1 范围(留 PRR · D-262)
 * AC-8: isFallback hint + error handle
 */

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sample {
  text: string;
  source: string;
}

interface DeepLearnDimensions {
  tone: string;
  structure: string;
  hook: string;
  transition: string;
  closing: string;
}

interface DeepLearnResult {
  summary: string;
  dimensions: DeepLearnDimensions;
  isFallback: boolean;
  tokensUsed: number;
  modelUsed: string;
  durationMs: number;
}

// ── Dimension labels ──────────────────────────────────────────────────────────

const DIMENSION_LABELS: Array<{ key: keyof DeepLearnDimensions; label: string; cn: string }> = [
  { key: 'tone', label: 'Tone', cn: '语气' },
  { key: 'structure', label: 'Structure', cn: '结构' },
  { key: 'hook', label: 'Hook', cn: '钩子' },
  { key: 'transition', label: 'Transition', cn: '转折' },
  { key: 'closing', label: 'Closing', cn: '收尾' },
];

// ── Result view ───────────────────────────────────────────────────────────────

function ResultView({ result }: { result: DeepLearnResult }) {
  return (
    <div className="space-y-4" data-testid="deep-learn-result">
      {result.isFallback && (
        <div
          className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800"
          data-testid="fallback-banner"
        >
          ⚠️ AI 服务繁忙，当前为备用结果，建议稍后重试以获取精准分析。
        </div>
      )}

      <Card className="border-primary/20 bg-surface-variant/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-body-md font-semibold">总体特征摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-on-surface" data-testid="result-summary">
            {result.summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DIMENSION_LABELS.map(({ key, cn }) => (
          <Card key={key} className="border-outline-variant">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-label-sm font-label text-primary uppercase tracking-wide">
                {cn}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p
                className="text-body-sm text-on-surface leading-relaxed"
                data-testid={`result-dimension-${key}`}
              >
                {result.dimensions[key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-label-xs text-on-surface-variant text-right">
        {result.modelUsed} · {result.tokensUsed} tokens · {result.durationMs}ms
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeepLearning() {
  const [textInput, setTextInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const learnMutation = trpc.deepLearning.learn.useMutation({
    onSuccess(data) {
      setJobId(data.jobId);
    },
    onError(err) {
      toast.error(`启动深度学习失败: ${err.message}`);
    },
  });

  const { data: statusData } = trpc.deepLearning.learnStatus.useQuery(
    { jobId: jobId ?? '' },
    {
      enabled: !!jobId,
      refetchInterval: (query) => {
        const status = (query.state.data as { status: string } | undefined)?.status;
        return !!jobId && status !== 'completed' && status !== 'failed' ? 3000 : false;
      },
    },
  );

  function handleAddSample() {
    if (textInput.trim().length < 10) {
      toast.error('文案内容至少 10 字');
      return;
    }
    if (!sourceInput.trim()) {
      toast.error('请填写来源名称');
      return;
    }
    if (samples.length >= 20) {
      toast.error('最多添加 20 篇样本');
      return;
    }
    setSamples((prev) => [...prev, { text: textInput.trim(), source: sourceInput.trim() }]);
    setTextInput('');
    setSourceInput('');
  }

  function handleRemoveSample(index: number) {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStartLearning() {
    if (samples.length === 0) {
      toast.error('请先添加至少 1 篇文案样本');
      return;
    }
    setJobId(null);
    learnMutation.mutate({ samples });
  }

  const isProcessing =
    learnMutation.isPending ||
    (!!jobId && (statusData?.status === 'queued' || statusData?.status === 'processing'));

  return (
    <main className="flex-1 container py-8" data-testid="deep-learning-page">
      <div className="mb-6">
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          智能工具
        </span>
        <h1 className="text-h1 font-display text-on-surface mt-1">文案深度学习</h1>
        <p className="text-body-md text-muted-foreground mt-2">
          添加优秀文案样本，AI 深度分析共性规律，总结 5 个核心写作维度
        </p>
      </div>

      {/* Input section */}
      <Card className="mb-6 border-outline-variant">
        <CardHeader className="pb-2">
          <CardTitle className="text-body-md font-semibold">添加文案样本</CardTitle>
          <p className="text-body-sm text-on-surface-variant">
            仅支持文字输入（P1）· file upload 留 PRR(D-262)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="source-input" className="text-body-sm font-medium">来源名称</label>
            <Input
              id="source-input"
              data-testid="source-input"
              placeholder="例如：小红书爆文 #1、抖音热门文案"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="text-input" className="text-body-sm font-medium">文案内容</label>
            <Textarea
              id="text-input"
              data-testid="text-input"
              placeholder="粘贴优秀文案内容（10-20000 字）"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-label-xs text-on-surface-variant text-right">
              {textInput.length}/20000
            </p>
          </div>

          <Button
            data-testid="add-sample-btn"
            variant="outline"
            onClick={handleAddSample}
            disabled={isProcessing}
          >
            添加这篇
          </Button>
        </CardContent>
      </Card>

      {/* Samples list */}
      {samples.length > 0 && (
        <Card className="mb-6 border-outline-variant">
          <CardHeader className="pb-2">
            <CardTitle className="text-body-md font-semibold">
              待学习样本
              <span className="ml-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-label-xs">
                {samples.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" data-testid="samples-list">
              {samples.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-outline-variant/50 p-3"
                  data-testid={`sample-item-${i}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-label-sm font-label text-primary">{s.source}</p>
                    <p className="text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                      {s.text.slice(0, 120)}{s.text.length > 120 ? '...' : ''}
                    </p>
                    <p className="text-label-xs text-on-surface-variant mt-1">
                      {s.text.length} 字
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSample(i)}
                    disabled={isProcessing}
                    data-testid={`remove-sample-${i}`}
                  >
                    移除
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Start button */}
      <div className="mb-6">
        <Button
          data-testid="start-learning-btn"
          onClick={handleStartLearning}
          disabled={samples.length === 0 || isProcessing}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {statusData?.status === 'processing' ? '分析中...' : '排队中...'}
            </>
          ) : (
            '开始深度学习'
          )}
        </Button>
      </div>

      {/* Status / Result */}
      {jobId && statusData && (
        <div data-testid="status-section">
          {statusData.status === 'failed' && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              分析失败，请检查样本内容后重试。
            </div>
          )}

          {statusData.status === 'completed' && statusData.result && (
            <ResultView result={statusData.result as DeepLearnResult} />
          )}
        </div>
      )}
    </main>
  );
}
