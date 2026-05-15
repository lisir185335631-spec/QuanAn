/**
 * PresentStyles.tsx — /tools/present-styles 呈现风格选择 · PRD-15 US-004
 * AC-2: 输入 textarea 文案 + select platform
 *       → trpc.presentStyles.recommend.useMutation()
 *       → PresentationAgent 推荐 3-5 种呈现风格(图文/短视频/直播口播/长图文/漫画)
 * AC-3: URL state useSearchParams + localStorage draft getToolLsKey(accountId,'presentStyles','draft')
 */

import {
  PRESENT_STYLE_LABELS,
  PRESENT_STYLE_TYPES,
  PRESENT_STYLE_PLATFORMS,
  type PresentStyleType,
  type PresentStylePlatform,
} from '@quanqn/schemas/specialist-io';
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

// Mock style cards shown after submission (stub — PresentationAgent 留 PRD-16+)
const MOCK_STYLES: Array<{ type: PresentStyleType; example: string; description: string }> = [
  {
    type: 'graphic_text',
    example: '图片+文字组合，适合知识科普和产品展示',
    description: '视觉信息密度高，便于用户保存转发',
  },
  {
    type: 'short_video',
    example: '15-60秒短视频，hook前3秒抓住注意力',
    description: '适合展示过程、对比和变身类内容',
  },
  {
    type: 'live_stream',
    example: '直播口播模式，边讲边互动',
    description: '实时互动转化率高，适合产品讲解',
  },
  {
    type: 'long_article',
    example: '长篇图文，深度内容输出，建立专业权威',
    description: 'SEO 友好，适合教程和深度分析',
  },
  {
    type: 'comic',
    example: '漫画/插图风格，趣味性强易于传播',
    description: '年轻用户偏爱，适合生活类和教育类',
  },
];

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

export default function PresentStyles() {
  const { account } = useActiveAccount();
  const accountId = (account as { id: number } | null)?.id ?? null;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialise from URL → localStorage → defaults
  const [text, setText] = useState<string>(() => {
    const urlText = searchParams.get('text') ?? '';
    if (urlText) return urlText;
    const draft = readDraft(accountId);
    return draft?.text ?? '';
  });

  const [platform, setPlatform] = useState<string>(() => {
    const urlPlatform = searchParams.get('platform') ?? '';
    if (urlPlatform) return urlPlatform;
    const draft = readDraft(accountId);
    return draft?.platform ?? '';
  });

  const [textError, setTextError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const recommendMutation = trpc.presentStyles.recommend.useMutation();

  const abortRef = useRef<AbortController>(null!);
  useEffect(() => {
    abortRef.current = new AbortController();
    return () => { abortRef.current.abort(); };
  }, []);

  // Sync form values to URL state (AC-3)
  useEffect(() => {
    setSearchParams((prev) => {
      if (text) prev.set('text', text); else prev.delete('text');
      if (platform) prev.set('platform', platform); else prev.delete('platform');
      return prev;
    }, { replace: true });
  }, [text, platform]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced LS draft write (AC-3)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(accountId, { text, platform });
    }, 600);
    return () => clearTimeout(timer);
  }, [text, platform, accountId]);

  async function handleSubmit(e: React.FormEvent) {
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

    if (abortRef.current.signal.aborted) return;

    try {
      await recommendMutation.mutateAsync({ text, platform });
      if (!abortRef.current.signal.aborted) {
        setSubmitted(true);
        setSearchParams((prev) => {
          prev.set('done', '1');
          return prev;
        });
      }
    } catch {
      if (!abortRef.current.signal.aborted) {
        toast.error('推荐失败 · 请重试');
      }
    }
  }

  function handleRetry() {
    setSubmitted(false);
    setSearchParams((prev) => {
      prev.delete('done');
      return prev;
    });
  }

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

      {submitted ? (
        <div className="space-y-4 max-w-2xl">
          <p className="text-body-sm text-muted-foreground">
            根据你的文案和平台，AI 推荐以下呈现风格：
          </p>
          <div className="space-y-3" data-testid="present-styles-result">
            {MOCK_STYLES.map((style) => (
              <Card key={style.type} className="border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-body-lg flex items-center gap-2">
                    <span className="text-primary font-semibold">
                      {PRESENT_STYLE_LABELS[style.type]}
                    </span>
                    <span className="text-body-xs text-muted-foreground font-normal">
                      {PRESENT_STYLE_TYPES.indexOf(style.type) === 0 ? '推荐' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-body-sm text-on-surface">{style.description}</p>
                  <p className="text-body-xs text-muted-foreground">示例：{style.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={handleRetry}>
            重新分析
          </Button>
        </div>
      ) : (
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
          >
            {recommendMutation.isPending ? '分析中…' : '推荐呈现风格'}
          </Button>
        </form>
      )}
    </main>
  );
}
