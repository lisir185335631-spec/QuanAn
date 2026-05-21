/**
 * PresentStyles.tsx — /tools/present-styles 呈现风格选择 · PRD-27 US-003
 * AC-6: 接 trpc.presentStyles.recommend.useMutation · 14 style card 显示
 *       推荐 3-5 高亮(matchScore + rationale 显示) · isFallback banner
 */

import { PRESENT_STYLE_PLATFORMS, type PresentStylePlatform } from '@quanan/schemas/specialist-io';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { PRESENT_STYLES } from '@/lib/constants/present-styles';
import { getToolLsKey } from '@/lib/ls-namespace';
import { trpc } from '@/lib/trpc';

const TOOL_KEY = 'presentStyles';

const PLATFORM_LABELS: Record<PresentStylePlatform, string> = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  shipinhao: '视频号',
  kuaishou: '快手',
  bilibili: 'B站',
  weibo: '微博',
  wechat: '公众号',
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface RecommendedStyle {
  id: string;
  label: string;
  description: string;
  tips: string;
  matchScore: number;
  rationale: string;
}

interface PresentationResult {
  recommendedStyles: RecommendedStyle[];
}

// ── Draft helpers ──────────────────────────────────────────────────────────────

interface DraftData {
  text: string;
  platform: string;
}

function readDraft(accountId: number | null): DraftData | null {
  if (accountId === null) return null;
  try {
    const raw = localStorage.getItem(getToolLsKey(accountId, TOOL_KEY, 'draft'));
    if (raw) return JSON.parse(raw) as DraftData;
  } catch {
    // ignore
  }
  return null;
}

function saveDraft(accountId: number | null, data: DraftData): void {
  if (accountId === null) return;
  try {
    localStorage.setItem(getToolLsKey(accountId, TOOL_KEY, 'draft'), JSON.stringify(data));
  } catch {
    // storage full
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PresentStyles() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [searchParams, setSearchParams] = useSearchParams();

  const [text, setText] = useState<string>(() => {
    const urlText = searchParams.get('text') ?? '';
    if (urlText) return urlText;
    return readDraft(accountId)?.text ?? '';
  });

  const [platform, setPlatform] = useState<string>(() => {
    const urlPlatform = searchParams.get('platform') ?? '';
    if (urlPlatform) return urlPlatform;
    return readDraft(accountId)?.platform ?? '';
  });

  const [textError, setTextError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [result, setResult] = useState<PresentationResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const recommendMutation = trpc.presentStyles.recommend.useMutation({
    onSuccess(data) {
      try {
        const parsed = JSON.parse(data.content) as PresentationResult;
        setResult(parsed);
        setIsFallback(data.isFallback);
      } catch {
        toast.error('推荐失败 · 请重试');
      }
    },
    onError() {
      toast.error('推荐失败 · 请重试');
    },
  });

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // Sync form values to URL state
  useEffect(() => {
    setSearchParams((prev) => {
      if (text) prev.set('text', text); else prev.delete('text');
      if (platform) prev.set('platform', platform); else prev.delete('platform');
      return prev;
    }, { replace: true });
  }, [text, platform]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced LS draft write
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(accountId, { text, platform });
    }, 600);
    return () => clearTimeout(timer);
  }, [text, platform, accountId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTextError(null);
    setPlatformError(null);

    let valid = true;
    if (text.length < 10) {
      setTextError('文案至少10字');
      valid = false;
    }
    if (!platform) {
      setPlatformError('请选择平台');
      valid = false;
    }
    if (!valid) return;

    setResult(null);
    setIsFallback(false);
    recommendMutation.mutate({ text, platform });
  }

  function handleRetry() {
    setResult(null);
    setIsFallback(false);
    recommendMutation.mutate({ text, platform });
  }

  // Determine recommended IDs for highlighting
  const recommendedIds = new Set(result?.recommendedStyles.map((s) => s.id) ?? []);

  return (
    <main className="flex-1 container py-8 space-y-8">
      <div>
        <span className="text-label-sm font-label text-primary uppercase tracking-wide">
          市场洞察
        </span>
        <h1 className="mt-1 text-h1 font-display text-on-surface">14 呈现形式</h1>
        <p className="mt-2 text-body-md text-muted-foreground">
          AI 推荐最适合你内容的呈现风格，找到最高效的表达方式
        </p>
      </div>

      {/* Form */}
      <form
        className="max-w-2xl space-y-6"
        onSubmit={(e) => { void handleSubmit(e); }}
        data-testid="present-styles-form"
        noValidate
      >
        {/* Textarea: 文案内容 */}
        <div className="space-y-1.5">
          <label htmlFor="ps-text" className="text-body-sm font-medium text-on-surface">
            文案内容<span className="text-error ml-0.5">*</span>
          </label>
          <textarea
            id="ps-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-body-sm text-on-surface shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            placeholder="粘贴你的文案内容（至少10字）"
          />
          <div className="flex justify-between items-center">
            {textError ? (
              <p className="text-body-xs text-error" role="alert">{textError}</p>
            ) : (
              <span />
            )}
            <span className="text-body-xs text-muted-foreground">{text.length} / 2000</span>
          </div>
        </div>

        {/* Select: 平台 */}
        <div className="space-y-1.5">
          <label htmlFor="ps-platform" className="text-body-sm font-medium text-on-surface">
            发布平台<span className="text-error ml-0.5">*</span>
          </label>
          <Select
            value={platform || undefined}
            onValueChange={(v) => setPlatform(v)}
          >
            <SelectTrigger
              id="ps-platform"
              className={platformError ? 'border-error' : ''}
              data-testid="platform-select"
            >
              <SelectValue placeholder="请选择目标平台" />
            </SelectTrigger>
            <SelectContent>
              {PRESENT_STYLE_PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {platformError && (
            <p className="text-body-xs text-error" role="alert">{platformError}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={recommendMutation.isPending}
          className="w-full sm:w-auto"
          data-testid="present-styles-submit"
        >
          {recommendMutation.isPending ? '分析中…' : '推荐呈现形式'}
        </Button>
      </form>

      {/* isFallback banner */}
      {result && isFallback && (
        <div
          className="max-w-2xl p-3 rounded-md bg-muted text-muted-foreground text-body-sm flex items-center gap-2"
          data-testid="present-styles-fallback-banner"
        >
          <span>⚠️ AI 暂时繁忙 · 显示备用推荐方案</span>
          <Button variant="ghost" size="sm" onClick={handleRetry} data-testid="present-styles-retry">
            重试
          </Button>
        </div>
      )}

      {/* Results: 14 style cards with recommended highlighted */}
      {result && (
        <div
          className="space-y-4 max-w-2xl"
          data-testid="present-styles-result"
        >
          <p className="text-body-sm text-muted-foreground">
            根据你的文案和平台，AI 推荐以下呈现形式（
            <span className="text-primary font-medium">{result.recommendedStyles.length} 个高亮推荐</span>
            ，其余供参考）：
          </p>

          {/* Recommended styles (highlighted) */}
          <div className="space-y-3" data-testid="present-styles-recommended">
            {result.recommendedStyles.map((style, idx) => (
              <Card
                key={style.id}
                className="border-2 border-primary bg-primary/5"
                data-testid={`recommended-style-${idx}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-body-lg flex items-center gap-2">
                    <span className="text-primary font-semibold">{style.label}</span>
                    <span className="text-body-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                      匹配度 {style.matchScore}%
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-body-sm text-on-surface">{style.description}</p>
                  <p className="text-body-xs text-muted-foreground">💡 {style.tips}</p>
                  <p className="text-body-xs text-primary/80 bg-primary/5 px-2 py-1 rounded">
                    推荐理由：{style.rationale}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All 14 styles for reference */}
          <div className="mt-6">
            <h2 className="text-body-sm font-medium text-muted-foreground mb-3">全部 14 种呈现形式</h2>
            <div className="space-y-2" data-testid="present-styles-all">
              {PRESENT_STYLES.map((style) => {
                const isRecommended = recommendedIds.has(style.id);
                if (isRecommended) return null; // already shown above
                return (
                  <Card
                    key={style.id}
                    className="border border-border opacity-70"
                    data-testid={`style-card-${style.id}`}
                  >
                    <CardHeader className="pb-1 pt-3">
                      <CardTitle className="text-body-md text-on-surface">{style.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-body-xs text-muted-foreground">{style.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Button variant="outline" onClick={handleRetry} data-testid="present-styles-retry-bottom">
            重新分析
          </Button>
        </div>
      )}
    </main>
  );
}
