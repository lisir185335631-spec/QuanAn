import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  STEP3_BUTTON_COPY,
  STEP3_BUTTON_COPY_ALL,
  STEP3_BUTTON_REGENERATE,
} from '@/lib/constants/step3';
import { STEP7_DEBATE_H4_4, type Step7Result } from '@/lib/constants/step7';

interface DebateBody {
  topic_hook: string;
  pros_arguments: string;
  cons_arguments: string;
  my_stance: string;
  comment_guide: string;
  topic_tags: string[];
}

// Map H4 id to debate body field text — AC-5 getBlockText 函数模式
function getBlockText(blockId: string, body: DebateBody): string {
  const map: Record<string, string> = {
    topic_hook: body.topic_hook,
    pros_arguments: body.pros_arguments,
    cons_arguments: body.cons_arguments,
    my_stance: body.my_stance,
  };
  return map[blockId] ?? '';
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast('已复制');
  } catch {
    toast.error('复制失败 · 请手动');
  }
}

interface Props {
  result: Step7Result;
  onRegenerate?: () => void;
}

export default function Step7OutputContent({ result, onRegenerate }: Props) {
  if (result.script_type === 'debate') {
    const body = result.body as DebateBody;

    function handleCopyAll() {
      const blocks = STEP7_DEBATE_H4_4.map(
        (h4) => `【${h4.h4Label}】\n${getBlockText(h4.id, body)}`,
      );
      const parts: string[] = [];
      if (result.title) parts.push(result.title);
      parts.push(...blocks);
      if (body.comment_guide) parts.push(body.comment_guide);
      if (body.topic_tags.length > 0)
        parts.push(body.topic_tags.map((t) => `#${t}`).join(' '));
      void copyToClipboard(parts.join('\n\n'));
    }

    return (
      <div className="space-y-6">
        {/* 顶部: title 居中 font-bold + 右侧 [重新生成][复制全部] — AC-1 AC-3 */}
        <div className="flex items-center gap-3">
          {result.title && (
            <h2 className="flex-1 text-center font-bold text-on-surface text-lg">
              {result.title}
            </h2>
          )}
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {STEP3_BUTTON_REGENERATE}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="h-4 w-4 mr-1" />
              {STEP3_BUTTON_COPY_ALL}
            </Button>
          </div>
        </div>

        {/* 4 H4 辩论区 — AC-1 AC-2 */}
        {STEP7_DEBATE_H4_4.map((h4) => {
          const content = getBlockText(h4.id, body);
          return (
            <div key={h4.id} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-label text-on-surface font-bold">{h4.h4Label}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => void copyToClipboard(content)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {STEP3_BUTTON_COPY}
                </Button>
              </div>
              <p className="text-body-sm text-on-surface leading-relaxed">{content}</p>
            </div>
          );
        })}

        {/* 评论区引导 — AC-2 */}
        {body.comment_guide && (
          <div className="rounded-lg border border-border bg-surface-container p-4">
            <p className="text-xs font-label text-muted-foreground mb-1">评论区引导</p>
            <p className="text-body-sm text-on-surface">{body.comment_guide}</p>
          </div>
        )}

        {/* 话题标签 chip — AC-2 · #{tag} 前缀由此处添加 */}
        {body.topic_tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {body.topic_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TODO: PRD-19 扩展 20 类独立 schema
  const body = result.body as { hook?: string; body?: string; cta?: string };
  const sections = [
    { id: 'hook', content: body.hook ?? '' },
    { id: 'body', content: body.body ?? '' },
    { id: 'cta', content: body.cta ?? '' },
  ];

  function handleCopyAll() {
    void copyToClipboard(
      [result.title, body.hook, body.body, body.cta].filter(Boolean).join('\n\n'),
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部: title 居中 font-bold + 右侧按钮 — AC-3 */}
      <div className="flex items-center gap-3">
        {result.title && (
          <h2 className="flex-1 text-center font-bold text-on-surface text-lg">
            {result.title}
          </h2>
        )}
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {STEP3_BUTTON_REGENERATE}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyAll}>
            <Copy className="h-4 w-4 mr-1" />
            {STEP3_BUTTON_COPY_ALL}
          </Button>
        </div>
      </div>

      {/* 通用 3 段渲染: hook / body / cta — AC-4 */}
      {sections.map((section) => (
        <div key={section.id} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-label text-on-surface font-bold">{section.id}</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => void copyToClipboard(section.content)}
            >
              <Copy className="h-3 w-3 mr-1" />
              {STEP3_BUTTON_COPY}
            </Button>
          </div>
          <p className="text-body-sm text-on-surface leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  );
}
